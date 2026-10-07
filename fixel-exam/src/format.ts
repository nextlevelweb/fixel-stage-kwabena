// This function turns a date into words, like "5m geleden" or "3u geleden".
// It counts how many minutes ago the date was, then picks minutes, hours or days.
export function timeAgo(date: string): string {
  const minutes =
    Math.floor((Date.now() - new Date(date).getTime()) / 60000);

  if (minutes < 1) {
    return "zojuist";
  }

  if (minutes < 60) {
    return minutes + "m geleden";
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return hours + "u geleden";
  }

  return Math.floor(hours / 24) + "d geleden";
}
