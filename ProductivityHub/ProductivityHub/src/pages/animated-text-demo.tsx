import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Demo from "@/components/ui/demo";
import { AnimatedMessage } from "@/components/ui/AnimatedMessage";
import { Bot, Sparkles } from "lucide-react";

const SAMPLE_AI_RESPONSE = `# Welcome to AI-Powered Learning!

I'm your AI assistant, here to help you with your studies. Here's what I can do for you:

## 📚 Study Support
- **Explain complex concepts** in simple terms
- **Break down difficult topics** into manageable parts
- **Provide examples** and analogies to aid understanding

## ✍️ Writing Assistance
- Help with **essay structure** and organization
- Provide **feedback** on your writing
- Suggest **improvements** and corrections

## 🧮 Problem Solving
- Walk through **step-by-step solutions**
- Explain **mathematical concepts**
- Help with **homework assignments**

## 💡 Quick Tips
1. Be specific with your questions
2. Provide context when asking for help
3. Don't hesitate to ask for clarification

Ready to start learning? Ask me anything!`;

export default function AnimatedTextDemo() {
  const [demoMessage, setDemoMessage] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const triggerDemo = () => {
    setDemoMessage("");
    setShowDemo(false);
    setTimeout(() => {
      setDemoMessage(SAMPLE_AI_RESPONSE);
      setShowDemo(true);
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-primary" />
            Animated Text Demo
          </h1>
          <p className="text-muted-foreground">
            Showcase of animated text components used in AI chat
          </p>
        </div>
      </div>

      <Tabs defaultValue="ai-response" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-response">AI Response Demo</TabsTrigger>
          <TabsTrigger value="chunk-character">Chunk to Character</TabsTrigger>
          <TabsTrigger value="chunk-word">Chunk to Word</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-response" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-6 w-6 mr-2" />
                AI Chat Response Animation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                See how AI responses appear with smooth text animation in the chat
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={triggerDemo} className="w-full">
                Start AI Response Demo
              </Button>
              
              {showDemo && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-lg bg-muted border border-border">
                    <AnimatedMessage 
                      content={demoMessage}
                      onAnimationComplete={() => console.log("Animation completed!")}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chunk-character" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chunk to Character Animation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Text appears paragraph by paragraph, then character by character
              </p>
            </CardHeader>
            <CardContent>
              <Demo.ChunkToCharacterDemo />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chunk-word" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chunk to Word Animation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Text appears paragraph by paragraph, then word by word
              </p>
            </CardHeader>
            <CardContent>
              <Demo.ChunkToWordDemo />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}