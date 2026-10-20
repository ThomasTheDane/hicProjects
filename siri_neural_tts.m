#import <Foundation/Foundation.h>
#import <CoreAudioTypes/CoreAudioTypes.h>
#import <dlfcn.h>
#import <objc/runtime.h>

@interface NSObject (SiriTTS)
- (id)initWithVoicePath:(NSString *)vp resourcePath:(NSString *)rp;
- (AudioStreamBasicDescription)asbd;
- (NSData *)pcmData;
- (id)synthesizeText:(NSString *)text
            loggable:(BOOL)loggable
      synthesisBegin:(int (^)(void))beginBlock
      synthesisChunk:(int (^)(id cbResult))chunkBlock
        synthesisEnd:(int (^)(void))endBlock;
@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        if (argc < 3) {
            fprintf(stderr, "Usage: siri_neural_tts <text> <output.pcm>\n");
            return 1;
        }
        NSString *text = [NSString stringWithUTF8String:argv[1]];
        NSString *outPath = [NSString stringWithUTF8String:argv[2]];

        dlopen("/System/Library/PrivateFrameworks/SiriSpeechSynthesis.framework/SiriSpeechSynthesis", RTLD_NOW);
        NSString *voicePath = @"/System/Library/AssetsV2/com_apple_MobileAsset_UAF_Siri_TextToSpeech/purpose_auto/f06564b027302d03bf75db2370493909677cee55.asset/AssetData";
        NSString *resPath = @"/System/Library/AssetsV2/com_apple_MobileAsset_UAF_Siri_TextToSpeech/purpose_auto/5d4a70d03f6ba52c495b460af4efe4d636f7d831.asset/AssetData";

        Class EngineCls = objc_getClass("SFSSTTSEngine");
        id engine = [[EngineCls alloc] initWithVoicePath:voicePath resourcePath:resPath];
        if (!engine) {
            fprintf(stderr, "Failed to initialize SFSSTTSEngine\n");
            return 2;
        }

        NSMutableData *pcm = [NSMutableData data];
        [engine synthesizeText:text
                      loggable:NO
                synthesisBegin:^int{
                    return 0;
                }
                synthesisChunk:^int(id cbResult) {
                    NSData *chunk = [cbResult pcmData];
                    if (chunk && chunk.length > 0) {
                        [pcm appendData:chunk];
                    }
                    return 0;
                }
                  synthesisEnd:^int{
                    return 0;
                }];

        [pcm writeToFile:outPath atomically:YES];
        printf("Synthesized %lu bytes (%.2f sec @ 48kHz)\n", (unsigned long)pcm.length, (double)pcm.length / (48000.0 * 2.0));
    }
    return 0;
}
