import axios from "axios";

async function main() {
  try {
    const phone = "62895339581136";
    const message = "Test pesan via API";

    console.log("Mengirim pesan...");

    await axios.post("http://localhost:3001/send", {
      phone,
      message
    });

    console.log("Pesan berhasil dikirim!");
  } catch (err) {
    console.error("Gagal:", err);
  }
}

main();
