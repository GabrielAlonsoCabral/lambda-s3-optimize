import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { S3 } from 'aws-sdk';
import { basename, extname } from 'path';
import sharp from "sharp";

const handlerS3Optimize = async ({Recods:records}) => {

  try {
    const S3Service = new S3();

    await Promise.all(records.map(async (record)=>{
      const { key } = record.s3.object;

      const image = await S3Service.getObject({
        Bucket:process.env.bucket,
        Key:key
      })
      .promise()
      .catch((error)=>console.error(error))

      if(!image) return

      // @ts-ignore
      const imageOptimized = await sharp(image.Body)      
      .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
      .toFormat("jpeg", { progressive: true, quality: 50 })
      .toBuffer();
      
      await S3Service.putObject({
        Body: imageOptimized,
        Bucket: process.env.bucket,
        ContentType: "image/jpeg",
        Key: `compressed/${basename(key, extname(key))}.jpg`
      }).promise();

    }))

    return formatJSONResponse({
      message: `Success to optimize your content.`,
      success:true,
    });      
  } catch (error) {
    console.error(error);
    return formatJSONResponse({
      message: `Failed to optimize your content.`,
      success:false,
      error
    });

  }

};

export const s3Optimize = middyfy(handlerS3Optimize);
