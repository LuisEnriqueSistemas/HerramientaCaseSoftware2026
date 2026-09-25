interface AudioFile {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
}
export declare class AudioTranscriptionService {
    transcribe(file: AudioFile | undefined): Promise<string>;
}
export {};
