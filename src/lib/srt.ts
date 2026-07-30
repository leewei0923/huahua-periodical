export interface SubtitleEntry {
  index: number;
  startTime: number; // 秒
  endTime: number;   // 秒
  text: string;
}

/**
 * 将 SRT 时间格式 (HH:MM:SS,mmm) 转换为秒数
 */
function parseTime(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':');
  const [secs, ms] = seconds.split(',');
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(secs, 10) +
    parseInt(ms, 10) / 1000
  );
}

/**
 * 解析 SRT 字幕文件内容
 */
export function parseSrt(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  
  // 按空行分割字幕块
  const blocks = content.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    const index = parseInt(lines[0], 10);
    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
    );
    
    if (!timeMatch) continue;
    
    const startTime = parseTime(timeMatch[1]);
    const endTime = parseTime(timeMatch[2]);
    const text = lines.slice(2).join('\n').trim();
    
    entries.push({ index, startTime, endTime, text });
  }
  
  return entries;
}

/**
 * 格式化秒数为 MM:SS 格式
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 根据当前播放时间获取对应的字幕索引
 */
export function getCurrentSubtitleIndex(
  entries: SubtitleEntry[],
  currentTime: number
): number {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (currentTime >= entries[i].startTime) {
      return i;
    }
  }
  return -1;
}
