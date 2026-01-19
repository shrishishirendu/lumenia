import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function convertWebmToWav(webmBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}.webm`);
  const outputPath = path.join(tempDir, `output_${Date.now()}.wav`);

  try {
    fs.writeFileSync(inputPath, webmBuffer);

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", inputPath,
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        "-y",
        outputPath
      ]);

      ffmpeg.stderr.on("data", () => {});
      
      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", reject);
    });

    const wavBuffer = fs.readFileSync(outputPath);
    return wavBuffer;
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch {}
  }
}
