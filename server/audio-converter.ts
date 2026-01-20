import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function convertWebmToWav(audioBuffer: Buffer, mimeType: string = "audio/webm"): Promise<Buffer> {
  const tempDir = os.tmpdir();
  
  // Determine file extension based on mimeType
  let ext = "webm";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
    ext = "m4a";
  } else if (mimeType.includes("ogg")) {
    ext = "ogg";
  } else if (mimeType.includes("wav")) {
    ext = "wav";
  }
  
  console.log(`Audio conversion: mimeType=${mimeType}, ext=${ext}, size=${audioBuffer.length}`);
  
  const inputPath = path.join(tempDir, `input_${Date.now()}.${ext}`);
  const outputPath = path.join(tempDir, `output_${Date.now()}.wav`);

  try {
    fs.writeFileSync(inputPath, audioBuffer);

    let ffmpegError = "";
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", inputPath,
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        "-y",
        outputPath
      ]);

      ffmpeg.stderr.on("data", (data) => {
        ffmpegError += data.toString();
      });
      
      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error("ffmpeg error output:", ffmpegError);
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", reject);
    });

    const wavBuffer = fs.readFileSync(outputPath);
    console.log(`Audio conversion successful: output size=${wavBuffer.length}`);
    return wavBuffer;
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch {}
  }
}
