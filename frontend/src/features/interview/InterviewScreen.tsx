import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/lib/api/client';
import { useVault } from '@/hooks/useVault';

export function InterviewScreen() {
    const { gaps, addUserAnswer, userAnswers, setGeneratedCV, setStage, setError, cvText, jobDescription } = useAppStore();
    const { getKey } = useVault();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [userAnswers, currentQuestionIndex]);

    const currentGap = gaps[currentQuestionIndex];
    const isFinished = currentQuestionIndex >= gaps.length;

    const handleSendAnswer = () => {
        if (!currentAnswer.trim()) return;

        addUserAnswer({
            question: currentGap.question,
            answer: currentAnswer
        });

        setCurrentAnswer('');
        setCurrentQuestionIndex(prev => prev + 1);
    };

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            // const apiKey = getKey();
            // const result = await ApiClient.generateCV(cvText, jobDescription, userAnswers, apiKey);
            const result = {
                "markdown_cv": "# Deyvison Penha\n\n**Senior Software Engineer**  \nLocation: Belém, Pará, Brazil  \nPhone: +55 91 988903426  \nEmail: deyvisonpenha1@gmail.com  \nLinkedIn: [linkedin.com/in/deyvison-penha](https://linkedin.com/in/deyvison-penha)  \nPortfolio: [easywriter-ai.com](https://easywriter-ai.com)\n\n## SUMMARY\nSenior Full-Stack Software Engineer with over 6 years of experience building scalable and high-performance web applications, with a recent focus on AI-integrated solutions. Proficient in JavaScript (React/Next.js and Node.js), with hands-on experience developing AI-powered features using OpenAI’s API, LangChain, and Retrieval-Augmented Generation (RAG). Skilled in designing backend services and cloud-based infrastructure (GCP, Docker, Kubernetes) optimized for both user experience and performance. Proven success in remote Agile teams, contributing to U.S.-based fintech and SaaS platforms.\n\n## CORE SKILLS\n- **Front-end:** React, Next.js, TypeScript, Tailwind CSS, GraphQL  \n- **Back-end:** Node.js, Ruby on Rails, Python, RESTful APIs  \n- **Databases:** MongoDB, PostgreSQL, Supabase, Firebase  \n- **Cloud & DevOps:** Google Cloud Platform (GCP), Docker, Kubernetes, CI/CD, Cloudflare Workers  \n- **Testing & Methodologies:** TDD (Jest, RSpec), Agile (Scrum/Kanban)  \n- **AI & Integrations:** LangChain, Hugging Face, Vercel AI, OpenAI API, AI model integration  \n- **Methodologies:** Domain-Driven Design (DDD), SOLID principles, Scrum, Kanban\n\n## PROFESSIONAL EXPERIENCE\n\n### Staff Engineer\n**Urgent Exits, USA – Remote**  \n08/2025 - Present\n\n- Led system architecture, cloud infrastructure, and API development, including the design and deployment of a high-performance Node.js API on Cloudflare Workers.\n- Drove product design and full-stack development for the Next.js platform, collaborating with stakeholders to shape features and UX.\n- Implemented robust authentication flows, admin tools, scalable data handling, and frontend architecture using TypeScript, Tailwind CSS, and Shadcn UI.\n\n**Key Technologies and Tools:** Next.js, React, Material UI, TypeScript, Node.js, Cloudflare Workers, Supabase (PostgreSQL + Auth), Vercel, Cron Jobs, Cloudflare KV/Secrets, REST APIs, System Architecture, CI/CD, Secure Credentials Management.\n\n### Software Engineer / Founder\n**Easywriter-AI, USA – Remote**  \n12/2024 - Present\n\n- Led the end-to-end development and launch of a B2C SaaS platform, owning product architecture, UX/UI, and full-stack implementation using Next.js, NestJS, TypeScript, Tailwind CSS, and Shadcn UI.\n- Designed and implemented a high-performance REST API using Cloudflare Workers and Node.js, integrating LangChain with GPT-4 and Gemini (Google) multimodal models.\n- Implemented seamless user authentication and subscription management with Firebase, Clerk, and Stripe.\n\n**Key Technologies and Tools:** Next.js, React, Tailwind CSS, Shadcn UI, Node.js, Cloudflare Workers, LangChain, GPT-4, Gemini (Google), Multimodal LLMs (MLLMs), Retrieval-Augmented Generation (RAG), Vector Search, Firebase, Clerk, Stripe, Resend API, OpenAI API, Google Cloud Platform (GCP).\n\n### Senior Lead Developer\n**Strictly Web, USA – Remote**  \n10/2024 - 01/2025\n\n- Developed and launched a responsive SaaS platform using Next.js, Node.js, and Tailwind CSS, increasing content creation speed by 40% through seamless AI integration.\n- Collaborated with AI teams to integrate LLMs, enabling real-time data retrieval, which increased user engagement by 30%.\n- Influenced architectural decisions to align AI-driven solutions with business goals, achieving a 20% reduction in server costs.\n\n**Key Technologies and Tools:** Next.js, Tailwind CSS, Shadcn UI, Node.js, OpenAI API (GPT-4, Embeddings, Function Calling), LangChain, LangSmith, Retrieval-Augmented Generation (RAG), MongoDB, Supabase, Clerk, Stripe, Chatbots, Scrum.\n\n### Senior Software Engineer\n**Latitude.sh, USA – Remote**  \n07/2023 - 07/2024\n\n- Led the development of new features and enhancements, improving user experience, code quality, and test coverage using Jest.\n- Built projects using Next.js with a focus on combining CSR and SSR.\n- Monitored and maintained platform stability with Bugsnag, leveraging actionable insights to streamline debugging.\n\n**Key Technologies and Tools:** Nextjs, Jest, Bugsnag, Kubernetes, Portainer, Docker, Python, FastAPI, Hugging Face, Stable Diffusion, LLMs, Shadcn UI, Tailwind CSS, Retool, Scrum, Jira, Stripe.\n\n### Full Stack Developer\n**Bairesdev, USA – Remote**  \n07/2021 - 06/2023\n\n- Successfully migrated a credit card platform from Ruby on Rails to ReactJS, implementing new UI/UX, and updating backend controllers.\n- Improved backend performance and ensured data integrity by updating APIs, controllers, and models in Ruby on Rails.\n\n**Key Technologies and Tools:** ReactJS, Ruby on Rails, Sidekiq, RSpec, GraphQL, JavaScript, Backbone, PostgreSQL, Material UI, Jest, Jenkins, Jira, Scrum.\n\n### Full Stack Developer\n**DevRemote, BR – Remote**  \n04/2018 - 07/2021\n\n- Developed scalable web applications using ReactJS, Next.js, Node.js, Ruby on Rails, and MongoDB.\n- Created REST APIs with Node.js and Ruby on Rails, also integrated automated tests with Jest or RSpec.\n\n**Key Technologies and Tools:** ReactJS, Next.js, MongoDB, React Native, Kanban, Scrum, Domain-Driven Design, GitFlow.\n\n## EDUCATION\n\n**Master’s in Engineering**  \nFederal University of Pará, Pará, Brazil  \n02/2016 - 05/2018  \n- Relevant Courses: Artificial Intelligence.\n\n**Bachelor’s in Computer Engineering**  \nFederal University of Pará, Pará, Brazil  \n03/2009 - 08/2013  \n- Relevant Courses: Software Engineering & Computational Systems and Circuits.\n\n## LANGUAGES\n- **Portuguese:** Native\n- **English:** Full professional proficiency\n",
                "optimization_report": "The CV was optimized to align with the job description for a Senior Backend Engineer at Sierra Studio's hiring partner. Key improvements include:\n\n1. **Focus on Backend Development:** Highlighted backend development experience, particularly with Node.js and RESTful APIs, to match the role's requirements.\n2. **Cloud Experience:** Emphasized experience with GCP and Cloudflare, aligning with the job's preference for familiarity with cloud environments.\n3. **Performance Improvement:** Detailed past experiences in improving system performance, which is a critical responsibility in the job description.\n4. **Startup Experience:** Highlighted experience in startup environments and fast-paced teams, which is highly valued by the employer.\n5. **Professional Formatting:** Used Markdown for a clean, professional presentation, ensuring key skills and experiences are easily accessible to recruiters.\n\nThe CV now better reflects the candidate's qualifications in relation to the job description, focusing on relevant skills and experiences that meet the employer's needs."
            };
            setGeneratedCV(result);
            setStage("READY");
        } catch (e: any) {
            setError(e.message || "Failed to generate CV.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto h-[600px] flex flex-col">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Gap Analysis Interview</h2>
                <p className="text-zinc-500">Help the AI understand your missing skills to optimize your CV.</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                    {/* History */}
                    {userAnswers.map((ans, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 dark:border-zinc-700 max-w-[85%]">
                                    <p className="text-sm">{gaps[i].question}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                                    <p className="text-sm">{ans.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Current Question */}
                    {!isFinished && (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="space-y-2 max-w-[85%]">
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 dark:border-zinc-700">
                                    <p className="text-sm font-medium">{currentGap.question}</p>
                                </div>
                                <p className="text-xs text-zinc-500 ml-2 italic">Context: {currentGap.context}</p>
                            </div>
                        </div>
                    )}

                    {/* Finished State */}
                    {isFinished && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium">Interview Complete!</h3>
                            <p className="text-sm text-zinc-500 text-center max-w-xs">
                                We have everything we need to generate your optimized CV.
                            </p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    {!isFinished ? (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type your answer..."
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer()}
                                autoFocus
                            />
                            <Button
                                size="icon"
                                onClick={handleSendAnswer}
                                disabled={!currentAnswer.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Optimized CV...
                                </>
                            ) : (
                                "Generate CV"
                            )}
                        </Button>
                    )}
                </div>
            </Card>

            <div className="text-center mt-4">
                <p className="text-xs text-zinc-400">
                    {currentQuestionIndex} of {gaps.length} questions answered
                </p>
            </div>
        </div>
    );
}
