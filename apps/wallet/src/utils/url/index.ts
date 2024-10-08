export const objToQuery = <T extends object>(obj: T, delimiter: string = '&') => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : String(value))}`)
    .join(delimiter)
}

export const queryToObj = <T extends object>(query: string, delimiter: string = '&') => {
  return Object.fromEntries(
    query
      .split(delimiter)
      .map((str) => str.split('='))
      .map(([key, value]) => {
        let val = String(value)
        try {
          const parsed = JSON.parse(decodeURIComponent(value))
          if (typeof parsed === 'object') {
            val = parsed
          }
        } catch (e) {}
        return [key, val]
      })
  ) as T
}
