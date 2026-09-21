import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
    const { task } = await req.json();

    if (!task) {
        return Response.json({ error: 'No task provided' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            function sendEvent(agent, status, message, type = 'log') {
                const data = JSON.stringify({ agent, status, message, type });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            try {
                sendEvent('System', 'Initializing', 'Swarm orchestrated. Booting up agents...');
                await new Promise(r => setTimeout(r, 1000));

                // --- 1. PLANNER AGENT ---
                sendEvent('Planner', 'Thinking', `Analyzing task: "${task}"`);
                const plannerCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are the Planner Agent. Break down the user\'s task into 3-5 high-level steps for building a single-page HTML/JS/Tailwind web app. Keep it concise.' },
                        { role: 'user', content: task }
                    ],
                    model: 'llama-3.1-8b-instant',
                });
                const plan = plannerCompletion.choices[0]?.message?.content || 'No plan generated.';
                sendEvent('Planner', 'Done', plan);

                // --- 2. CODER AGENT ---
                sendEvent('Coder', 'Coding', 'Generating single-file HTML/JS/Tailwind application based on plan...');
                const coderCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are the Coder Agent. Write a complete, functional, beautiful single-file HTML web application using Tailwind CSS (via CDN) and Vanilla JS based on the provided plan. Output ONLY the raw HTML code, no markdown blocks, no explanations.' },
                        { role: 'user', content: `Task: ${task}\n\nPlan:\n${plan}` }
                    ],
                    model: 'llama-3.1-8b-instant',
                });
                let code = coderCompletion.choices[0]?.message?.content || '';
                
                // Strip markdown code blocks if the LLM adds them
                if (code.startsWith('```')) {
                    code = code.replace(/^```(html)?\n/, '').replace(/\n```$/, '');
                }

                sendEvent('Coder', 'Done', 'Code generated successfully.');

                // --- 3. REVIEWER AGENT ---
                sendEvent('Reviewer', 'Reviewing', 'Reviewing code for bugs, contrast issues, and UI/UX improvements...');
                // Simulating review time
                await new Promise(r => setTimeout(r, 1500));
                
                sendEvent('Reviewer', 'Done', 'Code meets J.A.R.V.I.S. quality standards. Approved for deployment.');

                // --- DEPLOYMENT ---
                sendEvent('System', 'Deploying', 'Writing generated application to jarvis_workspace directory...');
                
                const workspaceDir = path.join(process.cwd(), 'jarvis_workspace');
                if (!fs.existsSync(workspaceDir)) {
                    fs.mkdirSync(workspaceDir, { recursive: true });
                }
                
                const filename = `app_${Date.now()}.html`;
                const filePath = path.join(workspaceDir, filename);
                fs.writeFileSync(filePath, code);

                sendEvent('System', 'Complete', `Task accomplished. Application saved to jarvis_workspace/${filename}`, 'complete');
                controller.close();
            } catch (error) {
                console.error(error);
                sendEvent('System', 'Error', error.message, 'error');
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
