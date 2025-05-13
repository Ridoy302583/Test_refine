import { useState, useEffect } from 'react';
import { Textarea } from '~/components/ui/Textarea';

const PromptsTab = () => {
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const MAX_WORDS = 200;

  useEffect(() => {
    const words = globalPrompt.trim() ? globalPrompt.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [globalPrompt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    if (words <= MAX_WORDS) {
      setGlobalPrompt(text);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-4xl w-full mx-auto space-y-3">
        {/* Header with gradient bar */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-purple-500/20">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20">
            <div className={'i-fluent:prompt-24-regular text-2xl text-blue-400'} />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Global System Prompt</h3>
            <p className="text-sm text-gray-300">Define how your AI assistant should behave in all conversations.</p>
          </div>
        </div>

        <div className="w-full relative">
          <div className="w-full bg-[#171717] rounded-lg border border-gray-800 overflow-hidden">
            <Textarea
              value={globalPrompt}
              onChange={handleInputChange}
              placeholder="Define how your AI assistant should behave in all conversations..."
              className="w-full min-h-[300px] p-4 bg-transparent text-gray-300 resize-none outline-none border-none"
              style={{ caretColor: '#fff' }}
            />
            <div className="absolute bottom-4 right-4 text-sm text-gray-500">
              {wordCount} / {MAX_WORDS} words
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptsTab;