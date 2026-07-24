import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Play, Loader2, Mic, Volume2, PlusCircle, CheckCircle2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const VOICE_GROUPS = [
  {
    label: '🎙️ أصوات رجالية',
    voices: [
      { id: 'Fenrir', name: 'وقور - جهوري (Fenrir)' },
      { id: 'Charon', name: 'عميق - رسمي (Charon)' },
      { id: 'Puck', name: 'ديناميكي - سردي (Puck)' },
      { id: 'Orus', name: 'حازم - قوي (Orus)' },
      { id: 'Enceladus', name: 'هامس - ناعم (Enceladus)' },
      { id: 'Iapetus', name: 'صافٍ - رجالي (Iapetus)' },
      { id: 'Algieba', name: 'سلس - ناعم (Algieba)' },
      { id: 'Algenib', name: 'خشن - عميق (Algenib)' },
      { id: 'Rasalgethi', name: 'إخباري - واضح (Rasalgethi)' },
      { id: 'Achernar', name: 'رقيق - خفيف (Achernar)' },
      { id: 'Alnilam', name: 'ثابت - حازم (Alnilam)' },
      { id: 'Schedar', name: 'متزن - رصين (Schedar)' },
      { id: 'Zubenelgenubi', name: 'عفوي - يومي (Zubenelgenubi)' },
      { id: 'Sadaltager', name: 'خبير - واثق (Sadaltager)' },
      { id: 'Umbriel', name: 'ودود - مريح (Umbriel)' },
      { id: 'Sadachbia', name: 'حيوي - نشيط (Sadachbia)' },
    ],
  },
  {
    label: '👩 أصوات نسائية',
    voices: [
      { id: 'Zephyr', name: 'صافي - مشرق (Zephyr)' },
      { id: 'Kore', name: 'واضح - دافئ (Kore)' },
      { id: 'Leda', name: 'شبابي - حيوي (Leda)' },
      { id: 'Aoede', name: 'منعش - خفيف (Aoede)' },
      { id: 'Callirrhoe', name: 'هادئ - لطيف (Callirrhoe)' },
      { id: 'Autonoe', name: 'مشرق - إيجابي (Autonoe)' },
      { id: 'Despina', name: 'سلس - ناعم (Despina)' },
      { id: 'Erinome', name: 'واضح - نقي (Erinome)' },
      { id: 'Laomedeia', name: 'مرح - نشيط (Laomedeia)' },
      { id: 'Gacrux', name: 'ناضج - رصين (Gacrux)' },
      { id: 'Pulcherrima', name: 'معبّر - جريء (Pulcherrima)' },
      { id: 'Achird', name: 'ودود - قريب (Achird)' },
      { id: 'Vindemiatrix', name: 'لطيف - رقيق (Vindemiatrix)' },
      { id: 'Sulafat', name: 'دافئ - محبب (Sulafat)' },
    ],
  },
];

// قائمة مسطّحة لكل الأصوات (تُستخدم للبحث عن اسم الصوت المختار)
const VOICES = VOICE_GROUPS.flatMap((g) => g.voices);

const EXAMPLES = [
  {
    title: 'نبرة وثائقية',
    text: 'فِي أَعْمَاقِ الْمُحِيطَاتِ، تُوجَدُ كَائِنَاتٌ مُذْهِلَةٌ، تَعِيشُ فِي ظَلَامٍ دَامِسٍ، وَتَتَحَرَّكُ بِجَاذِبِيَّةٍ تَسْحَرُ الْأَلْبَابَ. إِنَّهَا عَظَمَةُ الْخَالِقِ فِي دِقَّةِ التَّكْوِينِ.',
  },
  {
    title: 'نبرة إخبارية / رسمية',
    text: 'أَعْلَنَتِ الْمُؤَسَّسَةُ الْيَوْمَ عَنْ إِطْلَاقِ مَشْرُوعٍ عَالَمِيٍّ، يَهْدِفُ إِلَى تَعْزِيزِ اسْتِخْدَامِ اللُّغَةِ الْعَرَبِيَّةِ فِي تَطْبِيقَاتِ الذَّكَاءِ الِاصْطِنَاعِيِّ، لِتَكُونَ جِسْراً يَرْبِطُ الْمَاضِيَ بِالْمُسْتَقْبَلِ.',
  },
  {
    title: 'نطق الحروف والمدود',
    text: 'جَاءَ جَابِرٌ بِجَيْشٍ جَرَّارٍ، وَجَالَ فِي جَنَبَاتِ الْجَزِيرَةِ، بَاحِثاً عَنِ الْجَمَالِ وَالْجَلَالِ فِي آثَارِ الْأَجْدَادِ الْأَوَائِلِ.',
  }
];

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcm16ToWavBlob(pcmBytes: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): Blob {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, pcmBytes.length, true);

  const wavBytes = new Uint8Array(44 + pcmBytes.length);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(pcmBytes, 44);

  return new Blob([wavBytes], { type: 'audio/wav' });
}

export default function App() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const [voice, setVoice] = useState(VOICES[0].id);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Preview state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});
  
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  // Auto scroll to audio player when generated
  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [audioUrl]);

  const generateAudio = async (textToSpeak: string, selectedVoice: string): Promise<string> => {
    const instructionStr = "أنت خبير في التعليق الصوتي (Voice Over) باللغة العربية الفصحى. مهمتك هي تحويل النص المكتوب إلى صوت بشري طبيعي واحترافي تماماً، يراعي القواعد اللغوية بدقة عالية.\n\nالقواعد الصوتية الإلزامية:\n- نطق حرف (ج): يجب نطق الجيم المعطشة الفصحى بشكل واضح.\n- نطق الثاء والذال والظاء: يجب إخراج الحروف اللثوية من مخارجها الصحيحة.\n- المدود (آ): مراعاة المدود الطويلة والقصيرة بشكل طبيعي غير متكلف.\n- الوقفات (Pauses): الالتزام بوقفات تنفس طبيعية عند الفواصل ونهاية الجمل.\n- التشكيل: الالتزام التام بنطق الحركات (الفتحة، الضمة، الكسرة، والتنوين) لضمان الفصاحة.\n\nقم بقراءة النص التالي بناء على التعليمات السابقة:\n";
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: instructionStr + textToSpeak }] }],
      config: {
        responseModalities: ["AUDIO"] as any,
        temperature: 0.6,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const blob = pcm16ToWavBlob(bytes, 24000);
      return URL.createObjectURL(blob);
    }
    throw new Error('لم يتم استلام أي بيانات صوتية من الخادم. يرجى المحاولة مرة أخرى.');
  };

  const handlePreview = async () => {
    // If we already have a cached preview for this voice, just play it
    if (previewCache[voice]) {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = previewCache[voice];
        previewAudioRef.current.play();
      }
      return;
    }

    setIsPreviewing(true);
    setError(null);

    try {
      const shortPreviewText = 'هَذِهِ عَيِّنَةٌ صَوْتِيَّةٌ، هَلْ تُفَضِّلُ هَذَا الأَدَاءَ؟';
      const url = await generateAudio(shortPreviewText, voice);
      
      setPreviewCache(prev => ({ ...prev, [voice]: url }));
      
      if (previewAudioRef.current) {
        previewAudioRef.current.src = url;
        previewAudioRef.current.play();
      }
    } catch (err: any) {
      console.error("Preview generation failed:", err);
      let msg = err.message || 'حدث خطأ أثناء تحميل المعاينة.';
      if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        msg = 'خطأ في الصلاحيات (403): يبدو أن مفتاح الـ API الحالي لا يدعم ميزة تحويل النص لصوت. يرجى التأكد من تفعيل الميزة في إعدادات Gemini أو استخدام مفتاح API خاص بك.';
      }
      setError(msg);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const url = await generateAudio(text, voice);
      setAudioUrl(url);
      
      setTimeout(() => {
          if(audioRef.current) {
              audioRef.current.play();
          }
      }, 100);
    } catch (err: any) {
      console.error("Audio generation failed:", err);
      let msg = err.message || 'حدث خطأ غير متوقع أثناء المعالجة الصوتية.';
      if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        msg = 'خطأ في الصلاحيات (403): النموذج التجريبي للصوت يتطلب صلاحيات إضافية. يرجى استخدام مفتاح API خاص (Settings > Secrets) يدعم نماذج Gemini 3.1 Flash TTS.';
      }
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -m-32 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/50 to-blue-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -m-32 w-[600px] h-[600px] bg-gradient-to-tr from-amber-50/50 to-orange-50/50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <main className="max-w-4xl mx-auto relative z-10">
        <audio ref={previewAudioRef} className="hidden" />
        <header className="mb-10 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-6">
            <Mic className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800">
            التعليق الصوتي بالفصحى
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            استخدم قوة الذكاء الاصطناعي لتحويل نصوصك إلى صوت ناطق بالعربية الفصحى بأداء احترافي، دقيق التشكيل، وبجودة أستوديو عالي المستوى.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-md">
              
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 text-lg flex gap-2 items-center">
                  <Volume2 className="w-5 h-5 text-indigo-500" />
                  النص المراد تحويله
                </label>
                <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  لأفضل نتيجة، يفضل تشكيل النص
                </div>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition outline-none resize-none text-lg leading-relaxed shadow-inner"
                placeholder="أدخل النص المشكّل هنا..."
                dir="auto"
              />

              <div className="flex flex-wrap gap-4 items-center justify-between mt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-100 p-2 rounded-xl w-full sm:w-auto flex-1 border border-slate-200">
                   <label className="text-sm font-medium text-slate-600 mr-2 shrink-0">
                     اختر الصوت:
                   </label>
                   <div className="flex items-center gap-2 w-full">
                     <select 
                        value={voice} 
                        onChange={(e) => setVoice(e.target.value)}
                        className="bg-white border-0 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 block w-full p-2.5 shadow-sm outline-none cursor-pointer"
                     >
                       {VOICE_GROUPS.map((group) => (
                         <optgroup key={group.label} label={group.label}>
                           {group.voices.map((v) => (
                             <option key={v.id} value={v.id}>{v.name}</option>
                           ))}
                         </optgroup>
                       ))}
                     </select>
                     <button
                       onClick={handlePreview}
                       disabled={isPreviewing}
                       title="استمع لعينة من هذا الصوت"
                       className="p-2.5 bg-indigo-100/80 hover:bg-indigo-200 text-indigo-700 rounded-lg flex items-center justify-center transition shrink-0"
                     >
                       {isPreviewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                     </button>
                   </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري التحويل...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      تحويل إلى صوت
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

            </div>

            {/* Audio Player Card */}
            {audioUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white transform transition-all duration-500 translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">النتيجة الصوتية</h3>
                    <p className="text-slate-400 text-sm">بصوت {VOICES.find(v => v.id === voice)?.name}</p>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  controls
                  src={audioUrl}
                  className="w-full rounded-lg"
                />
                <a 
                  href={audioUrl} 
                  download="voiceover.wav"
                  className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  ↓ تحميل المقطع الصوتي
                </a>
              </div>
            )}
          </div>

          <aside className="md:col-span-4 flex flex-col gap-4">
            <h3 className="font-semibold text-slate-700 text-lg flex gap-2 items-center mb-1">
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              أمثلة جاهزة للتجربة
            </h3>
            
            <div className="flex flex-col gap-3">
              {EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setText(ex.text)}
                  className={`text-right p-4 rounded-xl border transition-all duration-200 group text-sm leading-relaxed ${
                    text === ex.text 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-bold mb-2 flex items-center justify-between">
                    <span className={text === ex.text ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-700'}>
                      {ex.title}
                    </span>
                    {text === ex.text && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-slate-600 line-clamp-3">
                    {ex.text}
                  </p>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-sm leading-relaxed shadow-inner">
               <strong className="block mb-1">نصيحة للمحترفين:</strong>
               تأكد من تشكيل أواخر الكلمات (الرفع والنصب والجر) للحصول على أداء مبهر يضاهي المذيعين الحقيقيين.
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
