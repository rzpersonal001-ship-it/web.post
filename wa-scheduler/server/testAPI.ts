import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function testDashboardOverview() {
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard/overview`);
    if (response.status === 200 && response.data) {
      logTest('Dashboard Overview API', true, `Fetched data successfully`);
      console.log('   - Stats:', JSON.stringify(response.data, null, 2));
      return true;
    }
    logTest('Dashboard Overview API', false, 'Invalid response structure');
    return false;
  } catch (error: any) {
    logTest('Dashboard Overview API', false, error.message);
    return false;
  }
}

async function testCategoriesAPI() {
  try {
    // Test GET categories
    const getResponse = await axios.get(`${BASE_URL}/api/categories`);
    if (getResponse.status === 200 && Array.isArray(getResponse.data)) {
      logTest('GET Categories API', true, `Found ${getResponse.data.length} categories`);
    } else {
      logTest('GET Categories API', false, 'Invalid response');
      return false;
    }

    // Test POST category
    const testCategoryName = `Test Category ${Date.now()}`;
    const postResponse = await axios.post(`${BASE_URL}/api/categories`, {
      name: testCategoryName,
      description: 'Auto-generated test category',
    });

    if (postResponse.status === 201 && postResponse.data.id) {
      logTest('POST Category API', true, `Created category: ${testCategoryName}`);
      return postResponse.data.id;
    } else {
      logTest('POST Category API', false, 'Failed to create category');
      return false;
    }
  } catch (error: any) {
    logTest('Categories API', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testPostsAPI(categoryId?: string) {
  try {
    // Test GET posts
    const getResponse = await axios.get(`${BASE_URL}/api/posts`);
    if (getResponse.status === 200 && getResponse.data.posts) {
      logTest('GET Posts API', true, `Found ${getResponse.data.total} posts`);
    } else {
      logTest('GET Posts API', false, 'Invalid response');
      return false;
    }

    // Test POST - save to library only
    const testPost = {
      postDetails: {
        caption: `Test post created at ${new Date().toISOString()}`,
        mediaType: 'IMAGE',
        mediaUrl: 'https://picsum.photos/800/600',
        categoryId: categoryId || null,
        saveToLibrary: true,
      },
      action: 'save',
    };

    const postResponse = await axios.post(`${BASE_URL}/api/posts`, testPost);
    if (postResponse.status === 201 && postResponse.data.post) {
      logTest('POST Create Post API', true, `Created post ID: ${postResponse.data.post.id}`);
      return postResponse.data.post.id;
    } else {
      logTest('POST Create Post API', false, 'Failed to create post');
      return false;
    }
  } catch (error: any) {
    logTest('Posts API', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testScheduleAPI(postId: string) {
  try {
    const scheduleData = {
      postDetails: {
        caption: 'Test scheduled post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://picsum.photos/800/600',
      },
      scheduleDetails: {
        scheduleType: 'ONCE',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        timeOfDay: '10:00',
        isActive: true,
      },
      action: 'schedule',
    };

    const response = await axios.post(`${BASE_URL}/api/posts`, scheduleData);
    if (response.status === 201 && response.data.schedule) {
      logTest('POST Schedule API', true, `Created schedule ID: ${response.data.schedule.id}`);
      return true;
    } else {
      logTest('POST Schedule API', false, 'Failed to create schedule');
      return false;
    }
  } catch (error: any) {
    logTest('Schedule API', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testScheduledJobsAPI() {
  try {
    const response = await axios.get(`${BASE_URL}/api/scheduled-jobs`);
    if (response.status === 200 && response.data.jobs) {
      logTest('GET Scheduled Jobs API', true, `Found ${response.data.total} jobs`);
      return true;
    } else {
      logTest('GET Scheduled Jobs API', false, 'Invalid response');
      return false;
    }
  } catch (error: any) {
    logTest('Scheduled Jobs API', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testWhatsAppConfigAPI() {
  try {
    const response = await axios.get(`${BASE_URL}/api/whatsapp-config`);
    if (response.status === 200) {
      logTest('GET WhatsApp Config API', true, 'Config fetched successfully');
      return true;
    } else {
      logTest('GET WhatsApp Config API', false, 'Invalid response');
      return false;
    }
  } catch (error: any) {
    logTest('WhatsApp Config API', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Automated API Tests...\n');
  console.log('='.repeat(60));

  // Test 1: Dashboard Overview
  await testDashboardOverview();

  // Test 2: Categories API
  const categoryId = await testCategoriesAPI();

  // Test 3: Posts API
  const postId = await testPostsAPI(categoryId || undefined);

  // Test 4: Schedule API
  if (postId) {
    await testScheduleAPI(postId);
  }

  // Test 5: Scheduled Jobs API
  await testScheduledJobsAPI();

  // Test 6: WhatsApp Config API
  await testWhatsAppConfigAPI();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Application is working perfectly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.\n');
  }

  return failed === 0;
}

// Run tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
