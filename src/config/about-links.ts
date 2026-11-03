/** 关于页允许的跳转地址。 */
export const aboutLinkAllowed = (value: string): string =>
  `not #strings.isEmpty((${value})) and ((${value}).matches('^https?://[^\\s]+$') or (${value}).matches('^#[^\\s]+$') or ((${value}).startsWith('/') and !(${value}).startsWith('//')))`;
