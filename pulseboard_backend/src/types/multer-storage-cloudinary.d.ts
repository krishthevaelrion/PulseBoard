declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';

  interface Options {
    cloudinary: any;
    params?: any;
  }

  function CloudinaryStorage(options: Options): StorageEngine;
  
  export default CloudinaryStorage;
}
