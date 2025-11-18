import { pathToFileURL } from 'url';

const WINDOWS_ABSOLUTE_PATH = /^[a-zA-Z]:[\\/]/;

export async function resolve(specifier, context, nextResolve) {
  if (WINDOWS_ABSOLUTE_PATH.test(specifier)) {
    const fileUrl = pathToFileURL(specifier);
    return nextResolve(fileUrl.href, context);
  }

  return nextResolve(specifier, context);
}

