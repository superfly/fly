function getErrorMessages(res: any): string[] {
  if (res.data.errors) {
    return res.data.errors.map((err: any) => errorMessage(err))
  }
  return []
}

function errorMessage(err: any): string {
  if (typeof err === 'string') {
    return err
  } else if (err.title && err.detail) {
    return `${err.title}: ${err.detail}`
  } else if (err.title) {
    return err.title
  } else if (err.detail) {
    return err.detail
  }
  return ''
}

export function processResponse(res: any, successFn?: Function | undefined): void {
  if (res.status >= 200 && res.status < 299) {
    if (successFn)
      successFn(res)
  } else {
    for (let errMsg of getErrorMessages(res)) {
      console.log(errMsg)
    }
  }
}
