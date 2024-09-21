export function placeholder(): string {
  let placeHolder: string = "";
  const limit = 13;
  for (let i = 0; i < limit; i++) {
    if (i != limit - 1) placeHolder += "GameName#Tag has joined the lobby\n";
    else placeHolder += "GameName#Tag has joined the lobby";
  }
  return placeHolder;
}
