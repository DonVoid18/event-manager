export const PRIVATE_FILE_ROUTE = "/api/private-files";

export const getPrivateFileUrl = (key: string) => {
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${PRIVATE_FILE_ROUTE}/${encodedKey}`;
};
