export interface ImageOperation{
  name: string,
  args: any[]
}

export interface ImageOperationResult{
  data: ArrayBuffer,
  info: any
}

interface ImageOperationFunction{
  (image: Image): Promise<ImageOperationResult>
}
let modifyImage: ImageOperationFunction

export default function initImage(ivm:any, dispatcher:any){
  modifyImage = async function modifyImage(image: Image): Promise<ImageOperationResult>{
    return new Promise<ImageOperationResult>((resolve, reject) => {
      dispatcher.dispatch("flyModifyImage",
        new ivm.ExternalCopy(image.data).copyInto({ release: true }),
        new ivm.ExternalCopy(image.operations).copyInto({ release: true}),
        new ivm.Reference((err:string, data:ArrayBuffer, info:any)=>{
          if(err){
            reject(err)
            return
          }
          console.log("Image info:", info)
          resolve({data: data, info: info})
        })
      )
    })
  }
  return Image
}

const gravity = {
  center: 0,
  centre: 0,
  north: 1,
  east: 2,
  south: 3,
  west: 4,
  northeast: 5,
  southeast: 6,
  southwest: 7,
  northwest: 8
};

const strategy = {
  entropy: 16,
  attention: 17
}

const kernel = {
  nearest: 'nearest',
  cubic: 'cubic',
  lanczos2: 'lanczos2',
  lanczos3: 'lanczos3'
}
export class Image{
  data: ArrayBuffer
  operations: ImageOperation[]
  info: any
  constructor(data:ArrayBuffer){
    if(!(data instanceof ArrayBuffer)){
      throw new Error("Data must be an ArrayBuffer")
    }
    //console.log("data:", data.constructor)
    this.data = data
    this.operations = []
  }

  resize(...args:any[]){
    this.operations.push({name: "resize", args: args})
    return this
  }

  crop(...args:any[]){
    this.operations.push({name: "crop", args: args})
    return this
  }

  embed(...args:any[]){
    this.operations.push({name: "embed", args: args})
    return this
  }

  withoutEnlargement(...args:any[]){
    this.operations.push({name: "withoutEnlargement", args: args})
    return this
  }

  png(...args:any[]){
    this.operations.push({name: "png", args: args})
    return this
  }

  webp(...args:any[]){
    this.operations.push({name: "webp", args: args})
    return this
  }

  withMetadata(...args:any[]){
    this.operations.push({name: "withMedata", args: args})
    return this
  }

  async toBuffer(): Promise<ImageOperationResult>{
    if(!modifyImage){
      throw new Error("Image operations not enabled")
    }
    const result = await modifyImage(this)
    return result
  }

  async toImage(): Promise<Image>{
    const result = await this.toBuffer()
    const i = new Image(result.data)
    i.info = result.info
    return i 
  }

  static get strategy(){
    return strategy
  }
  static get gravity(){
    return gravity
  }
  static get kernel(){
    return kernel
  }
}