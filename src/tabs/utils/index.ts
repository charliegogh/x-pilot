interface URLParams {
  [key: string]: string;
}
export const getURLParams = (name?: string): string | URLParams | undefined => {
  const searchPar = new URLSearchParams(window.location.search)
  const paramsObj: URLParams = {}

  for (const [key, value] of searchPar.entries()) {
    paramsObj[key] = value
  }

  if (name) {
    return paramsObj[name]
  }
  return paramsObj
}
