
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getGeminiApiKey, setGeminiApiKey } from '@/services/geminiService';

export const ApiKeyInput = () => {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(!!getGeminiApiKey());
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim());
      setIsKeySet(true);
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved for this session",
      });
    }
  };

  const handleReset = () => {
    setGeminiApiKey('');
    setApiKey('');
    setIsKeySet(false);
    toast({
      title: "API Key Removed",
      description: "Your Gemini API key has been removed",
    });
  };

  return (
    <div className="mb-6 p-4 glass-card">
      <h3 className="text-lg font-medium mb-2">Gemini AI Search</h3>
      {!isKeySet ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground mb-2">
            Enter your Gemini API key to enable AI-powered search. 
            Make sure you have access to the Gemini API and use a key for the gemini-2.0-flash model.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Gemini API key"
              className="flex-1"
            />
            <Button type="submit" disabled={!apiKey.trim()}>
              Save Key
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600">
            ✓ Gemini API key set. AI search is enabled.
          </p>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Key
          </Button>
        </div>
      )}
    </div>
  );
};
