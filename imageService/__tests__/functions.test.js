const fs = require("fs");
const path = require("path");
const functions = require("../functions");

var aws = require("aws-sdk");
aws.config.update({ region: "ap-southeast-2" });
var s3 = new aws.S3({ apiVersion: "2006-03-01" });

const mockBucket = "dxlabimagebucket";

describe("functions", async () => {
  beforeAll(async () => {
    // Create mock testing environment
    const mockBucketParams = {
      Bucket: mockBucket,
      CreateBucketConfiguration: {
        LocationConstraint: "ap-southeast-2"
      }
    };
    await s3.createBucket(mockBucketParams).promise();

    const mockFolderPath = path.join(__dirname, "./mockItems");
    const files = fs.readdirSync(mockFolderPath);

    for (const file of files) {
      const filePath = path.join(mockFolderPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      await s3
        .upload({
          Bucket: mockBucket,
          Key: file,
          Body: fileBuffer
        })
        .promise();
    }
  });

  afterAll(async () => {
    // Delete all items in S3 bucket
    var getBucketObjectsParams = {
      Bucket: mockBucket
    };

    const result = await s3.listObjectsV2(getBucketObjectsParams).promise();

    for (var i = 0; i < result.Contents.length; i++) {
      await s3
        .deleteObject({ Bucket: mockBucket, Key: result.Contents[i].Key })
        .promise();
    }

    // Delete mock bucket
    const deleteBucketParams = {
      Bucket: mockBucket
    };

    await s3.deleteBucket(deleteBucketParams).promise();
  });

  it("should list images in an S3 bucket", async () => {
    const result = await functions.images(mockBucket);
    expect(result.length).toBe(2);
  });

  it("should return image with metadata", async () => {
    const imageName = "hood_00101r.jpg";
    const result = await functions.image(mockBucket, imageName);

    expect("image" in result).toBe(true);
    expect("metadata" in result).toBe(true);
  });
});
