export function initials(firstName: string, lastName: string) {
  const a = firstName.at(0) ?? "";
  const b = lastName.at(0) ?? "";
  const s = `${a}${b}`.trim().toUpperCase();
  return s || "?";
}
