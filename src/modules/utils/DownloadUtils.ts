import axios from "axios";
import path from "path";
import fs from "fs";

class DownloadUtils {
  static downloadByBatch = async (
    data: any[],
    downloadFunction: any,
    isLogProcess: boolean = false,
    batchSize: number = 5
  ) => {
    for (let i = 0; i < data.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, data.length);
      const sliceData = data.slice(from, to);
      await Promise.all(
        sliceData.map((item: any, index: number) =>
          downloadFunction(item, from + index + 1)
        )
      );
      if (isLogProcess) {
        console.log(`🔥Downloaded ${to}/${data.length} items`);
      }
    }
  };

  static downloadMedia = async (
    mediaDownloadUrl: string,
    outputPath: string
  ) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const writer = fs.createWriteStream(outputPath);
    try {
      const response = await axios.get(mediaDownloadUrl, {
        responseType: "stream",
      });

      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      writer.close();
    }
  };
}

export default DownloadUtils;
