"""Decode an actual exported MP4 and verify timing, codecs and each sound scene.

Requires ffmpeg / ffprobe on PATH; no third-party Python packages.
"""
import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import subprocess


def run(*args):
    return subprocess.run(args, capture_output=True, check=True).stdout


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('video', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    meta = json.loads(run('ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(args.video)))
    video = next(s for s in meta['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in meta['streams'] if s['codec_type'] == 'audio')
    assert video['codec_name'] == 'h264' and audio['codec_name'] == 'aac'
    assert audio['channels'] == 2 and audio['sample_rate'] == '48000'
    assert abs(float(video['duration']) - 48) < .001
    assert abs(float(audio['duration']) - 48) < .022
    assert float(video['start_time']) == 0 and float(audio['start_time']) == 0
    n, d = map(int, video['r_frame_rate'].split('/'))
    assert int(video['nb_read_frames']) == round(48 * n / d)
    pcm = array('f')
    pcm.frombytes(run('ffmpeg', '-v', 'error', '-i', str(args.video), '-map', '0:a:0', '-ac', '2', '-ar', '48000', '-f', 'f32le', 'pipe:1'))
    assert abs(len(pcm) / 2 / 48000 - 48) < .022
    scenes = []
    for name, start, end in [('original', 0, 18), ('galaxy', 20, 25), ('tornado', 27, 32), ('dna', 34, 39), ('text', 41, 46), ('return', 46, 48)]:
        part = pcm[start * 96000:end * 96000]
        rms = math.sqrt(sum(v * v for v in part) / len(part))
        peak = max(abs(v) for v in part)
        difference = math.sqrt(sum((part[i] - part[i + 1]) ** 2 for i in range(0, len(part), 2)) / (len(part) / 2))
        assert rms > .001, (name, 'unexpected silence / inaudible mix')
        assert peak < .99, (name, 'clipping')
        scenes.append({'scene': name, 'range_seconds': [start, end], 'rms_dbfs': round(20 * math.log10(rms), 2),
                       'peak_dbfs': round(20 * math.log10(peak), 2), 'stereo_difference_rms': round(difference, 6)})
    # Check the new passages do not collapse in level relative to the original.
    assert scenes[0]['rms_dbfs'] - min(s['rms_dbfs'] for s in scenes[1:5]) < 10
    evidence = {
        'file': args.video.name, 'sha256': hashlib.sha256(args.video.read_bytes()).hexdigest(), 'bytes': args.video.stat().st_size,
        'duration': float(meta['format']['duration']), 'video': {k: video[k] for k in ['codec_name', 'width', 'height', 'r_frame_rate', 'nb_read_frames', 'duration', 'start_time']},
        'audio': {k: audio[k] for k in ['codec_name', 'sample_rate', 'channels', 'duration', 'start_time']},
        'decoded_audio_seconds': len(pcm) / 96000, 'scene_levels': scenes,
    }
    if args.output:
        args.output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(evidence, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
