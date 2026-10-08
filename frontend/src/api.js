export async function api(path, options = {}) {
  const token = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrftoken="))
    ?.split("=")
    .slice(1)
    .join("=");
  const response = await fetch(`/api/${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": decodeURIComponent(token || ""),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unexpected response. Check that the backend is running.",
    );
  }
  if (!response.ok)
    throw new Error(data.error || "This request could not be completed.");
  return data;
}
