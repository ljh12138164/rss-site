export function looksLikeEnglish(text: string) {
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0
  const han = text.match(/[\p{Script=Han}]/gu)?.length ?? 0
  return latin >= 20 && latin > han * 2
}
