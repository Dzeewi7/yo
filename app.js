/**
 * SpeechSpark - Main Application Logic
 * Implements client-side speech generation, text-to-speech, teleprompter, and local history management.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================
    let currentSpeech = {
        id: null,
        title: '',
        category: 'general',
        tone: 'inspirational',
        length: 'medium',
        audience: '',
        relationship: '',
        keywords: '',
        text: '',
        timestamp: null
    };

    let speechHistory = [];
    let isHistoryOpen = false;
    let ttsUtterance = null;
    let isTtsPlaying = false;
    let isTtsPaused = false;
    
    // Teleprompter state
    let isTeleprompterActive = false;
    let isTeleprompterScrolling = false;
    let teleprompterScrollSpeed = 15; // default scale (1 to 40)
    let teleprompterFontSize = 36; // px
    let scrollRequestFrame = null;
    let lastScrollTime = 0;

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    const configForm = document.getElementById('speech-config-form');
    const selectCategory = document.getElementById('speech-category');
    const inputTopic = document.getElementById('speech-topic');
    const inputRelationship = document.getElementById('speech-relationship');
    const groupRelationship = document.getElementById('relationship-group');
    const selectTone = document.getElementById('speech-tone');
    const selectLength = document.getElementById('speech-length');
    const inputAudience = document.getElementById('speech-audience');
    const textareaKeywords = document.getElementById('speech-keywords');
    const topicLabel = document.getElementById('topic-label');

    // Workbench States
    const stateEmpty = document.getElementById('workbench-empty');
    const stateLoading = document.getElementById('workbench-loading');
    const stateResult = document.getElementById('workbench-result');
    const loadingTitle = document.getElementById('loading-status-title');
    const loadingDesc = document.getElementById('loading-status-desc');

    // Speech Result Card
    const badgeCategory = document.getElementById('badge-category');
    const badgeTone = document.getElementById('badge-tone');
    const badgeLength = document.getElementById('badge-length');
    const inputTitle = document.getElementById('speech-title');
    const textareaSpeechText = document.getElementById('speech-text');
    const indicatorSaveStatus = document.getElementById('save-status');

    // Actions
    const btnGenerate = document.getElementById('generate-btn');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const btnTeleprompter = document.getElementById('btn-teleprompter');

    // TTS
    const selectTtsVoice = document.getElementById('tts-voice-select');
    const rangeTtsSpeed = document.getElementById('tts-speed-range');
    const valTtsSpeed = document.getElementById('tts-speed-val');
    const btnTtsPlay = document.getElementById('btn-tts-play');
    const btnTtsStop = document.getElementById('btn-tts-stop');

    // History Drawer
    const btnToggleHistory = document.getElementById('toggle-history-btn');
    const drawerHistory = document.getElementById('history-drawer');
    const drawerOverlay = document.getElementById('history-drawer-overlay');
    const btnCloseHistory = document.getElementById('close-history-btn');
    const historyBadge = document.getElementById('history-badge');
    const historyList = document.getElementById('history-list');
    const historyEmptyState = document.getElementById('history-empty');
    const inputHistorySearch = document.getElementById('history-search');
    const btnClearAllHistory = document.getElementById('clear-all-history');

    // Teleprompter
    const teleprompterOverlay = document.getElementById('teleprompter');
    const teleprompterTitle = document.getElementById('teleprompter-title');
    const teleprompterDuration = document.getElementById('teleprompter-duration');
    const teleprompterClose = document.getElementById('teleprompter-close');
    const teleprompterScrollContainer = document.getElementById('teleprompter-scroll-container');
    const teleprompterText = document.getElementById('teleprompter-text');
    const teleprompterPlay = document.getElementById('teleprompter-play');
    const teleprompterRewind = document.getElementById('teleprompter-rewind');
    const teleprompterSpeedSlider = document.getElementById('teleprompter-speed');
    const teleprompterSpeedVal = document.getElementById('teleprompter-speed-val');
    const teleprompterFontSlider = document.getElementById('teleprompter-fontsize');
    const teleprompterFontVal = document.getElementById('teleprompter-fontsize-val');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // ==========================================================================
    // INITIALIZATION & EVENT BINDINGS
    // ==========================================================================
    
    // Load local history
    loadHistoryFromStorage();
    
    // Setup TTS voices
    setupTtsVoices();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = setupTtsVoices;
    }

    // Dynamic label changes & relationship field display toggles
    selectCategory.addEventListener('change', (e) => {
        const category = e.target.value;
        
        // Toggle Relationship/Role display
        if (category === 'wedding' || category === 'tribute') {
            groupRelationship.style.display = 'flex';
            inputRelationship.setAttribute('required', 'true');
            if (category === 'wedding') {
                inputRelationship.placeholder = 'e.g., Best Man, Maid of Honor, Bride\'s Father';
                topicLabel.textContent = 'Couples\' Names or Wedding Theme';
                inputTopic.placeholder = 'e.g., Sarah and Michael\'s Wedding';
            } else {
                inputRelationship.placeholder = 'e.g., Lifelong Friend, Daughter, Colleague';
                topicLabel.textContent = 'Honoree Name / Special Occasion';
                inputTopic.placeholder = 'e.g., Memorial for Uncle Robert';
            }
        } else {
            groupRelationship.style.display = 'none';
            inputRelationship.removeAttribute('required');
            topicLabel.textContent = 'Speech Topic';
            
            if (category === 'graduation') {
                inputTopic.placeholder = 'e.g., Class of 2026 / Academic Excellence';
            } else if (category === 'business') {
                inputTopic.placeholder = 'e.g., Launch of Sustainable Logistics Platform';
            } else if (category === 'motivational') {
                inputTopic.placeholder = 'e.g., Overcoming Failure & Unleashing Potential';
            } else {
                inputTopic.placeholder = 'e.g., Future of Renewable Energy';
            }
        }
    });

    // Handle Generation Form Submit
    configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        triggerSpeechGeneration();
    });

    // Handle Editor changes -> Auto save updates
    textareaSpeechText.addEventListener('input', () => {
        currentSpeech.text = textareaSpeechText.value;
        currentSpeech.timestamp = Date.now();
        triggerAutoSave();
    });

    inputTitle.addEventListener('input', () => {
        currentSpeech.title = inputTitle.value.trim() || 'Untitled Speech';
        currentSpeech.timestamp = Date.now();
        triggerAutoSave();
    });

    // Utility actions
    btnCopy.addEventListener('click', copySpeechToClipboard);
    btnDownload.addEventListener('click', downloadSpeechAsFile);
    btnTeleprompter.addEventListener('click', startTeleprompter);

    // Text to Speech bindings
    btnTtsPlay.addEventListener('click', toggleTts);
    btnTtsStop.addEventListener('click', stopTts);
    rangeTtsSpeed.addEventListener('input', (e) => {
        valTtsSpeed.textContent = parseFloat(e.target.value).toFixed(1);
        if (isTtsPlaying) {
            // Re-trigger speak to apply new speed
            const currentPosition = getSpeechTtsPosition();
            stopTts();
            playTts(currentPosition);
        }
    });

    // History drawer toggle
    btnToggleHistory.addEventListener('click', () => toggleHistoryDrawer(true));
    btnCloseHistory.addEventListener('click', () => toggleHistoryDrawer(false));
    drawerOverlay.addEventListener('click', () => toggleHistoryDrawer(false));
    inputHistorySearch.addEventListener('input', renderHistoryList);
    btnClearAllHistory.addEventListener('click', clearAllHistory);

    // Teleprompter bindings
    teleprompterClose.addEventListener('click', closeTeleprompter);
    teleprompterPlay.addEventListener('click', toggleTeleprompterScroll);
    teleprompterRewind.addEventListener('click', rewindTeleprompter);
    
    teleprompterSpeedSlider.addEventListener('input', (e) => {
        teleprompterScrollSpeed = parseInt(e.target.value);
        teleprompterSpeedVal.textContent = teleprompterScrollSpeed;
    });

    teleprompterFontSlider.addEventListener('input', (e) => {
        teleprompterFontSize = parseInt(e.target.value);
        teleprompterFontVal.textContent = teleprompterFontSize;
        teleprompterText.style.fontSize = `${teleprompterFontSize}px`;
    });

    // Keyboard bindings for teleprompter
    window.addEventListener('keydown', (e) => {
        if (!isTeleprompterActive) return;
        
        if (e.code === 'Space') {
            e.preventDefault(); // Stop page scroll default
            toggleTeleprompterScroll();
        } else if (e.code === 'Escape') {
            e.preventDefault();
            closeTeleprompter();
        }
    });

    // Bind viewport scroll changes on teleprompter text to highlight focus
    teleprompterScrollContainer.addEventListener('scroll', throttle(highlightTeleprompterFocusText, 100));


    // ==========================================================================
    // SPEECH GENERATOR ENGINE (RULE-BASED SYSTEM)
    // ==========================================================================

    function triggerSpeechGeneration() {
        // Collect form data
        const category = selectCategory.value;
        const topic = inputTopic.value.trim();
        const relationship = inputRelationship.value.trim();
        const tone = selectTone.value;
        const length = selectLength.value;
        const audience = inputAudience.value.trim();
        const keywordsInput = textareaKeywords.value.trim();

        // Show loading state with animated progress texts
        switchState('loading');
        
        const loadingSteps = [
            { title: "Analyzing topic constraints...", desc: `Targeting standard formulas for ${audience}.` },
            { title: "Drafting structural hook...", desc: `Applying a custom ${tone} style outline.` },
            { title: "Integrating core keywords...", desc: `Weaving in keyword details organically.` },
            { title: "Smoothing paragraph transitions...", desc: "Finalizing logical flow and polishing syntax." }
        ];

        let stepIndex = 0;
        const progressInterval = setInterval(() => {
            if (stepIndex < loadingSteps.length) {
                loadingTitle.textContent = loadingSteps[stepIndex].title;
                loadingDesc.textContent = loadingSteps[stepIndex].desc;
                stepIndex++;
            } else {
                clearInterval(progressInterval);
                
                // Construct the speech
                const speechText = generateSpeechContent(category, topic, relationship, tone, length, audience, keywordsInput);
                const speechTitle = generateSpeechTitle(category, topic);

                // Save to active speech
                currentSpeech = {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    title: speechTitle,
                    category: category,
                    tone: tone,
                    length: length,
                    audience: audience,
                    relationship: relationship,
                    keywords: keywordsInput,
                    text: speechText,
                    timestamp: Date.now()
                };

                // Load to UI
                loadSpeechToEditor(currentSpeech);
                
                // Add to history and local storage
                saveSpeechToHistory(currentSpeech);
                
                // Change back to result
                switchState('result');
                showToast("Speech generated successfully!", "success");
            }
        }, 600); // Fast progressive loading sequence (~2.4s total)
    }

    function generateSpeechTitle(category, topic) {
        const cleaned = topic.length > 30 ? topic.substring(0, 30) + '...' : topic;
        switch (category) {
            case 'wedding':
                return `Wedding Toast - ${cleaned}`;
            case 'graduation':
                return `Commencement Address for ${cleaned}`;
            case 'business':
                return `Pitch Deck Presentation: ${cleaned}`;
            case 'tribute':
                return `Tribute to ${cleaned}`;
            case 'motivational':
                return `Keynote Speech: ${cleaned}`;
            default:
                return `Speech on ${cleaned}`;
        }
    }

    /**
     * core generator combining phrases, logic, templates, and keywords
     */
    function generateSpeechContent(category, topic, relationship, tone, length, audience, keywordsText) {
        // Parse keywords
        let keywords = [];
        if (keywordsText) {
            keywords = keywordsText.split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);
        }

        // Setup clean fallback words based on topic if keywords are lacking
        if (keywords.length === 0) {
            keywords = [topic, "collaboration", "growth", "vision", "dedication"].slice(0, 3);
        }

        // Word formatting helpers
        const kw1 = keywords[0] || "opportunity";
        const kw2 = keywords[1] || "perseverance";
        const kw3 = keywords[2] || "excellence";
        const kw4 = keywords[3] || "connection";

        // Determine paragraphs count based on length
        let numBodyParagraphs = 2; // Medium default
        if (length === 'short') numBodyParagraphs = 1;
        if (length === 'long') numBodyParagraphs = 4;

        // Build Speech components
        const opening = getOpeningSegment(category, tone, topic, relationship, audience, kw1);
        const bodies = getBodySegments(category, tone, topic, relationship, audience, keywords, numBodyParagraphs);
        const conclusion = getConclusionSegment(category, tone, topic, relationship, audience, kw2, kw3, kw4);

        // Combine into readable layout
        let speechParts = [opening, ...bodies, conclusion];
        
        // Clean double spaces and normalize formatting
        return speechParts.join('\n\n').replace(/\s+/g, ' ').replace(/ \./g, '.').replace(/ ,/g, ',');
    }

    // --- TEMPLATE HOOKS & PARAGRAPH BLOCKS ---

    function getOpeningSegment(category, tone, topic, relationship, audience, primaryKeyword) {
        // Openers by Category
        const openers = {
            wedding: {
                inspirational: `Good evening, everyone. For those who don't know me, I am ${relationship}. Standing here today, looking around this beautiful room filled with love, I am deeply moved. We are gathered not just to witness a union, but to celebrate the inspiring journey of two souls who have found in one another a true harbor. As we reflect on the topic of ${topic}, we realize that love is not just a feeling, but a daily dedication to building something larger than ourselves.`,
                humorous: `Hello, everyone! As the designated ${relationship} for today, I was given two strict instructions: keep it clean, and keep it brief. I'll try my best, though those who know me know that's a tough ask! We are here to celebrate ${topic}, and looking at the couple tonight, I can't help but marvel at the absolute magic of love—or, as I like to think of it, the mutual agreement to annoy each other for the rest of our lives.`,
                emotional: `Good evening, family and friends. Standing here as ${relationship}, my heart is incredibly full. Today, we stand on the threshold of a beautiful adventure. As we celebrate ${topic}, we see the threads of two distinct, amazing lives weaving together into a single tapestry. It is a moment of deep gratitude, reflecting on the path that brought us here and the incredible promise of the future.`,
                formal: `Distinguished guests, family, and friends, it is my privilege to welcome you this evening. As ${relationship}, I am honored to offer these opening remarks on this momentous occasion. Today we celebrate the marriage and union focusing on ${topic}. This milestone marks the formal beginning of a shared legacy, one built on trust, respect, and mutual understanding.`,
                persuasive: `Good evening. I speak to you tonight not just as ${relationship}, but as a believer in the power of deep commitment. Today, as we celebrate ${topic}, we are witnessing a profound truth: that when two people dedicate themselves to a singular vision of partnership, they become stronger, more resilient, and capable of overcoming any obstacle.`,
                professional: `Welcome, everyone. It is a pleasure to address the guests tonight as ${relationship}. In analyzing the journey that brings us to celebrate ${topic}, we recognize the fundamental principles of alignment and synergy. Today, we formally recognize a partnership designed for long-term emotional and personal success.`
            },
            graduation: {
                inspirational: `Honored faculty, proud parents, and above all, the graduating class—welcome. Standing before you today, looking out at this sea of bright, eager faces, I am filled with an overwhelming sense of hope. Today is more than a ceremony; it is a launchpad. As we gather to discuss ${topic}, we recognize that this moment is a testament to your hard work, your curiosity, and your willingness to dream.`,
                humorous: `To the teachers who tolerated us, the parents who financed us, and my fellow students who copy-pasted our way here—congratulations! We actually made it. Today, we celebrate our graduation and look back at ${topic}. If these years have taught us anything, it's that sleep is optional, caffeine is a food group, and Google is the ultimate teacher. But in all seriousness, we stand here victorious.`,
                emotional: `Dear graduates, family, and teachers. There is a beautiful, heavy warmth in the air today. Looking around, I don't just see diplomas; I see late nights, struggles overcome, and friendships that have become family. As we celebrate ${topic}, I want us to take a quiet moment to look at the people sitting next to us, and the parents who supported us, to appreciate just how far we have walked together.`,
                formal: `Members of the board, administrative officers, faculty, guests, and graduates. I welcome you to this commencement ceremony. Today we gather to recognize academic achievements and reflect upon the theme of ${topic}. This academic milestone serves as a formal validation of scholarship, discipline, and intellectual advancement.`,
                persuasive: `Graduates, the world outside these walls is not waiting for you to find yourself; it is waiting for you to shape it. Today, as we mark our graduation and address ${topic}, we must realize that our education is not a shield to protect us, but a sword to carve a path through uncertainty. The future belongs to those who take action.`,
                professional: `Good morning, colleagues, faculty, and graduates. It is an honor to speak on this commencement stage. As we examine the current landscape of ${topic}, we see a rapidly changing environment that demands structured problem solving, continuous skill acquisition, and ethical leadership.`
            },
            business: {
                inspirational: `Good morning, partners, investors, and colleagues. I want to thank you for your time. Today, I want to invite you to look beyond the numbers and share a vision that could redefine our landscape. Our focus today is ${topic}. We are not here to present just another product or process, but to embark on a journey of innovation that will solve real problems and elevate the way we work.`,
                humorous: `Welcome, everyone. Thank you for showing up—especially since I know there's free coffee in the other room. Today we are looking at ${topic}. In business, they say you either adapt or become a cautionary tale. Well, we've chosen to adapt, and hopefully, this presentation will show you why we're not planning to become a slide in someone else's slide deck!`,
                emotional: `Hello, everyone. Behind every successful venture, there is a human story. Today, as I introduce ${topic}, I want to speak about the passion, the setbacks, and the belief that fueled this project. This isn't just about market share; it's about the people whose lives will be made easier, safer, and more connected by what we have built here.`,
                formal: `Ladies and gentlemen, thank you for your attendance at this business brief. Today, I present the strategic initiative regarding ${topic} to our key stakeholders. This executive briefing outlines our operational roadmap, market analysis, and the quantitative data supporting our long-term projections.`,
                persuasive: `Thank you for being here. Let's get straight to the point: the market is crowded, resources are tight, and efficiency is paramount. That is why our initiative, ${topic}, is not just an option—it is a critical necessity. Today, I will demonstrate how we can capture value, eliminate waste, and dominate this segment.`,
                professional: `Good day, stakeholders and management team. Today's presentation outlines the development, metrics, and strategic positioning of ${topic}. Our primary objective is to review the quantitative milestones and outline the scalable architecture we've developed to secure a competitive advantage.`
            },
            tribute: {
                inspirational: `Dear friends and family, we are gathered here to honor the life and legacy of someone truly extraordinary. As ${relationship}, I have had the privilege of watching how they navigated life. Today, as we focus on the theme of ${topic}, we are not just mourning a loss; we are celebrating a beacon of light. Their story is a reminder of what it means to live with purpose, kindness, and grace.`,
                humorous: `Hello, everyone. They say the best way to honor someone is to speak the absolute truth, so let me start by saying: they were one of a kind—and thank goodness for that, because the world couldn't handle two! As ${relationship}, I have so many stories about ${topic}. They loved a good laugh, and they would be the first to tell us to dry our tears and share a funny memory instead.`,
                emotional: `Beloved friends, my voice might tremble today, because the loss we feel is vast. As ${relationship}, I want to speak from the heart about ${topic}. Some people leave an imprint on your soul that time can never fade. Today is about remembering the warmth of their voice, the safety of their presence, and the quiet ways they made our lives beautiful.`,
                formal: `Respected colleagues, family members, and distinguished guests. We gather in this formal assembly to pay tribute and reflect upon ${topic}. As ${relationship}, it is my responsibility to articulate the professional contributions, civic duty, and enduring character that marked their career and life.`,
                persuasive: `Thank you for joining us. We are here to pay tribute, but let us do more than that. Let us vow to carry their torch. As ${relationship}, looking back at ${topic}, I see a life that challenges us. They did not settle for mediocrity, and they demand that we do not settle either. Let this tribute be a call to action for all of us.`,
                professional: `Good afternoon. We are gathered to formally acknowledge the achievements and dedication surrounding ${topic}. As ${relationship}, I will present an overview of their career milestones, community impact, and the systemic improvements they introduced to our organization.`
            },
            motivational: {
                inspirational: `Look around you. Every person in this room is carrying a dream, a struggle, and a spark of raw potential. Today, we are here to talk about ${topic}. I want to ask you a simple question: what would you do if you knew you could not fail? The barriers we face are often just illusions. It is time to break through, step into your power, and claim the future that is waiting for you.`,
                humorous: `Hello, everyone! I was told to motivate you today, which is funny because some mornings I struggle to motivate myself to get out of bed! But here we are, talking about ${topic}. They say motivation is like bathing—it doesn't last, which is why it's recommended daily. So, let's take a refreshing plunge together and look at how we can crush our goals without losing our minds.`,
                emotional: `Thank you for being here. I want to speak to the person in this room who feels tired. The one who has been fighting, working, and wondering if it's all worth it. Today, as we address ${topic}, I want you to know that your struggle is not in vain. The scars you carry are not signs of weakness; they are proof that you fought, survived, and are ready to rise.`,
                formal: `Distinguished delegates and guests, welcome to today's keynote address. The subject of my presentation is ${topic}. In this era of systemic volatility, it is critical that we evaluate the core drivers of human performance, psychological resilience, and collective organizational adaptability.`,
                persuasive: `Let's cut through the noise. Success isn't a secret, and it isn't a stroke of luck. It is a decision. Today, as we focus on ${topic}, I am here to challenge your assumptions, disrupt your comfort zones, and demand that you demand more of yourself. You have the tools; now it's time to build.`,
                professional: `Good day. Today's address focuses on performance optimization, specifically concerning the variables of ${topic}. We will analyze empirical strategies to align individual motivations with corporate goals, establishing a scalable model for long-term productivity.`
            },
            general: {
                inspirational: `Good day, everyone. It is a pleasure to speak with you. When we look at the world around us, we see that progress is driven by those who dare to ask 'what if?' Today, as we discuss ${topic}, we are examining a topic that touches the core of our shared aspirations. It is an opportunity to challenge our perspectives, align our efforts, and spark a meaningful difference.`,
                humorous: `Hello, everyone. Thanks for coming. I know we all have a million things to do, so I appreciate you spending your valuable time listening to me talk about ${topic}. They say public speaking is the number one fear, ahead of death. Which means, statistically, most people at a funeral would rather be in the casket than giving the eulogy. I'll try to make sure this talk isn't that painful!`,
                emotional: `Welcome, friends. There are topics that require us to step back from our busy routines and connect on a deeper level. Today, as we explore ${topic}, we are touching upon something that matters to our families, our communities, and our shared future. It is about understanding, empathy, and the quiet values that bind us together.`,
                formal: `Respected audience members, welcome. I stand before you to deliver an address regarding ${topic}. This discussion serves to analyze the current developments, historical context, and societal implications surrounding this subject matter. I invite your formal attention to these findings.`,
                persuasive: `Thank you. I want to talk to you today about a matter of critical importance: ${topic}. We cannot afford to sit on the sidelines any longer. The choices we make today will ripple through our careers, our communities, and our futures. I ask you to listen with an open mind, but most importantly, to prepare to take action.`,
                professional: `Good morning, colleagues and industry professionals. The purpose of this address is to provide a structured overview of ${topic}. We will explore key frameworks, look at operational benchmarks, and outline strategic recommendations based on current industry developments.`
            }
        };

        // Fallback checks
        const catGroup = openers[category] || openers['general'];
        const openerText = catGroup[tone] || catGroup['inspirational'];
        
        return openerText.replace('{relationship}', relationship || 'a speaker')
                          .replace('{topic}', topic)
                          .replace('{audience}', audience)
                          .replace('{keywords}', primaryKeyword);
    }

    function getBodySegments(category, tone, topic, relationship, audience, keywords, numParagraphs) {
        // Dynamic generation based on keywords, tone, and category
        const segments = [];
        
        // Let's create a bank of body paragraph templates that can be chosen and filled.
        const bodyTemplates = {
            inspirational: [
                "At the core of this discussion lies the concept of {keyword}. When we look closely at {topic}, we find that true progress is never a straight line. It is forged in moments of quiet dedication, where individuals work together toward a shared horizon. This is exactly what {audience} represents—a community built on trust and a collective drive to make things better.",
                "Let us remember that every great achievement begins with the courage to take the first step. By focusing our efforts on {keyword}, we open doors that previously seemed locked. It is not about the absence of challenges, but the strength of our resolve. Together, we can harness our unique strengths to transform our ideas into reality.",
                "Furthermore, the journey is just as important as the destination. Through {keyword}, we learn the value of collaboration and empathy. We begin to understand that our individual goals are deeply connected to the well-being of those around us. It is this realization that empowers us to build lasting foundations.",
                "As we move forward, let us carry a sense of curiosity and optimism. In the face of uncertainty, our commitment to {keyword} will serve as our compass. Let us encourage one another, celebrate our small victories, and never lose sight of the bigger picture."
            ],
            humorous: [
                "Now, we can't talk about {topic} without addressing the elephant in the room: {keyword}. In my experience, trying to master this is a lot like trying to assemble flat-pack furniture. You start with high hopes, follow the diagrams, and end up with three extra screws and a table that wobbles if someone sneezes. But that's where the fun is!",
                "They say experience is what you get when you didn't get what you wanted. And let's be honest, we've accumulated a lot of 'experience' with {keyword} lately. But humor is the secret weapon that gets us through the chaotic days. If we can laugh at our mistakes, we can survive almost anything—even another three-hour meeting that could have been an email.",
                "Let's look at the data. Science tells us that stressing about {keyword} burns exactly zero calories. So instead of pulling our hair out, we might as well embrace the messy, unpredictable nature of what we do. After all, the best stories always come from the things that went hilariously wrong.",
                "In conclusion of this point, let's keep our standards high and our patience levels even higher. If we can manage {keyword} with a smile, or at least a sarcastic grin, we're already ahead of 90% of the competition. Let's keep moving, laughing, and figuring it out as we go."
            ],
            professional: [
                "From an operational perspective, integrating {keyword} is essential to achieving our objectives regarding {topic}. Our structured analysis indicates that key metrics are highly dependent on systematic execution. By aligning resources with this focus area, we can optimize outputs and minimize friction points across departments.",
                "Furthermore, empirical data supports the transition toward a more structured methodology. When we evaluate the role of {keyword}, we observe a clear correlation with increased efficiency and long-term stability. It is critical that we establish standard protocols to monitor progress and maintain quality control.",
                "In terms of scalability, focusing on {keyword} allows us to build a robust framework capable of adapting to market demands. This approach ensures that our initiatives are not only sustainable but also capable of delivering consistent value to our stakeholders and {audience}.",
                "To implement this strategy successfully, we must foster a culture of data-driven decision-making. By leveraging insights related to {keyword}, we can identify emerging trends, mitigate risks, and position ourselves advantageously in a competitive landscape."
            ],
            emotional: [
                "When we strip away the titles and the noise, what truly matters is how we make people feel. In dealing with {topic}, the thread of {keyword} connects us all. It reminds us of our vulnerability, our shared struggles, and the profound beauty of human connection. It is in these moments that we find our true strength.",
                "I am reminded of a quiet moment that taught me the true meaning of dedication. It wasn't a grand gesture, but a simple act centered on {keyword}. It showed me that the smallest gestures of kindness and support can ripple outward, changing lives in ways we may never fully realize.",
                "We must recognize that we do not walk this path alone. The support of {audience} is the anchor that holds us steady in turbulent times. By opening our hearts to {keyword}, we allow ourselves to grow, heal, and build a community where everyone feels valued and heard.",
                "As we look back at the memories we've shared, let us hold onto the warmth and the lessons. Let the spirit of {keyword} guide our actions, ensuring that our legacy is one of compassion, understanding, and love."
            ],
            formal: [
                "In addressing the complexities of {topic}, it is necessary to examine the primary role of {keyword}. A comprehensive review of the historical development reveals that structural stability is contingent upon this factor. Consequently, our current policies must reflect this fundamental requirement.",
                "Moreover, the alignment of institutional objectives with the principles of {keyword} represents a vital step toward organizational maturity. We must adhere to established standards and exercise rigorous oversight to ensure compliance and maintain public trust.",
                "It is also imperative to consider the broader implications for the community at large. The deployment of initiatives centering on {keyword} must be balanced with ethical considerations and a commitment to long-term sustainability.",
                "In closing this analysis, we affirm that the path forward demands intellectual discipline and structural integrity. By prioritizing {keyword}, we establish a formal framework that honors our heritage while preparing for future challenges."
            ],
            persuasive: [
                "Let us be completely honest: the status quo is no longer acceptable. If we want to solve the problems surrounding {topic}, we must aggressively commit to {keyword}. Half-measures will not work. We need a bold, decisive approach that challenges existing paradigms and demands immediate action.",
                "Think about the alternative. If we fail to prioritize {keyword}, we are choosing stagnation. We are choosing to let opportunities pass us by while others take the lead. The choice is clear, and the responsibility rests squarely on our shoulders. We must act now.",
                "The evidence is overwhelming. Organizations and communities that have embraced {keyword} have seen dramatic improvements in performance, satisfaction, and resilience. This is not a theory; it is a proven roadmap to success that we must adopt immediately.",
                "I urge you to join me in this effort. Let us push past the skepticism and the inertia. By locking our focus onto {keyword}, we can create a powerful momentum that will sweep aside obstacles and deliver the results we deserve."
            ]
        };

        const toneTemplates = bodyTemplates[tone] || bodyTemplates['inspirational'];

        for (let i = 0; i < numParagraphs; i++) {
            // Select template cycling through available templates
            const tmpl = toneTemplates[i % toneTemplates.length];
            
            // Choose a keyword for this paragraph, cycling through available inputs
            const keywordIndex = i % keywords.length;
            const kw = keywords[keywordIndex] || "progress";
            
            // Format and append
            let pText = tmpl.replace('{keyword}', kw)
                            .replace('{topic}', topic)
                            .replace('{audience}', audience);
            segments.push(pText);
        }

        return segments;
    }

    function getConclusionSegment(category, tone, topic, relationship, audience, kw1, kw2, kw3) {
        const conclusions = {
            wedding: {
                inspirational: `As I conclude my remarks, I want to leave the couple with a simple thought. May you always find strength in each other, and may your days be guided by the same warmth and dedication to ${kw1} that we witnessed today. Let us all raise our glasses and toast to a lifetime of adventures, trust, and beautiful growth. To the happy couple!`,
                humorous: `Well, I've managed to avoid any major embarrassment, and I see the caterers are ready, so I will wrap this up. Remember, the secret to a happy marriage is simple: always get the last word, as long as that word is 'Yes, dear.' Let's raise our glasses to two people who are clearly perfect for each other. Cheers!`,
                emotional: `My final wish for you is that you look back at today not just as the day you got married, but as the day you began a beautiful, endless conversation. In moments of challenge, remember the love that fills this room right now, and let it lead you back to ${kw1}. Cheers to your beautiful future together.`,
                formal: `In conclusion, on behalf of all present, I extend our formal congratulations. May your partnership be characterized by enduring resilience, intellectual alignment, and mutual support. Let us raise our glasses to honor this marriage and toast to a stable and prosperous future.`,
                persuasive: `So, let us look forward with confidence. The commitment we celebrated today is a powerful testament to what is possible when two people align their visions. Let us all support them, learn from them, and raise our glasses to their shared success. To the couple!`,
                professional: `In summary, the synergy demonstrated today establishes a solid foundation for personal and mutual development. We formally conclude these remarks by wishing the partners continued alignment and success in all their future endeavors. Please join me in a toast.`
            },
            graduation: {
                inspirational: `So, Class of 2026, as you step out of this hall and into the world, remember this: you are the authors of the next chapter. Do not fear failure; embrace it as a stepping stone. Carry the principles of ${kw1} and ${kw2} with you. Go out there, work hard, and make us proud. Congratulations!`,
                humorous: `So, let's go forth and conquer the world—or at least update our LinkedIn profiles! We survived the exams, the group projects, and the cafeteria food. We can survive anything. Congratulations to us all, let's celebrate tonight because tomorrow, the real work begins!`,
                emotional: `As we part ways, remember that the bonds we forged here will remain. Take care of yourselves, look out for each other, and carry the lessons of empathy and ${kw1} in your hearts. The world is waiting for your light. Congratulations, graduates.`,
                formal: `Graduates, as you transition to your respective careers and academic pursuits, I charge you to uphold the integrity of this institution. Let your contributions reflect academic rigor and civic responsibility. I formally congratulate the graduating class.`,
                persuasive: `The challenge has been laid down. You have the education, you have the drive, and you have the opportunity. Do not wait for permission to lead; step forward and make a difference. The future is ours to build. Let's get to work.`,
                professional: `In conclusion, we trust that you will utilize the frameworks and knowledge acquired here to drive progress in your respective fields. Maintain professional excellence and continue to contribute to the advancement of your sectors. Congratulations.`
            },
            business: {
                inspirational: `Thank you for your attention. I believe that by joining forces on this initiative, we are not just securing our business, but building a legacy of innovation centered on ${kw1}. Let us collaborate, dream big, and turn this potential into a shared reality.`,
                humorous: `So, that's the plan. It's bold, it's efficient, and it will hopefully keep us all employed for a long time! Thank you for your time, and let's go make this happen before our competitors figure out what we're doing.`,
                emotional: `Thank you. At the end of the day, our work is about the lives we touch. Let us carry this project forward with a sense of purpose and pride, knowing that our dedication to ${kw1} is making a real difference.`,
                formal: `This concludes the executive briefing. I trust the details provided establish a clear case for strategic alignment. We look forward to your formal feedback and to executing this roadmap in accordance with our timeline. Thank you.`,
                persuasive: `The numbers are clear, the timing is perfect, and the capability is here. Let us not hesitate. I ask for your support to greenlight this project today so we can begin execution immediately and capture this market opportunity.`,
                professional: `In summary, this initiative satisfies all strategic, financial, and operational criteria for investment. We thank you for your review and are prepared to address any technical questions you may have. Thank you.`
            },
            tribute: {
                inspirational: `In ending, let us not only remember their words, but let us live their values. Let us honor their memory by practicing the same dedication to ${kw1} that made them so beloved. May they rest in peace, knowing their light continues to shine in us.`,
                humorous: `So, let's raise a glass, share a laugh, and celebrate a life that was truly lived to the fullest. They wouldn't want us to sit in silence; they'd want us to celebrate the joy they brought into our lives. Thank you all.`,
                emotional: `Though they are no longer with us, their love remains an anchor. Let us carry their memory in our hearts, allowing their gentleness and strength to guide our steps. We will love and remember you, always.`,
                formal: `In closing, we formally record our appreciation for their dedicated service, exemplary character, and institutional contributions. They leave a legacy that will be respected for generations. Thank you.`,
                persuasive: `Let us honor them not with tears, but with actions. Let us take up their challenges, continue their work, and ensure that the values they stood for continue to thrive in our community. That is our responsibility.`,
                professional: `In conclusion, their contributions have established benchmarks that will continue to guide our department. We formally conclude this memorial, expressing gratitude for their service and extending condolences to the family.`
            },
            motivational: {
                inspirational: `So, I challenge you today: do not settle. Push past the boundaries, believe in your potential, and commit to ${kw1}. Your time is now. Go out there and make it happen. Thank you!`,
                humorous: `So, remember: dream big, work hard, and if all else fails, just look busy! Thank you for listening, and let's go crush some goals today.`,
                emotional: `Your journey is unique, your struggle is real, but your capacity to rise is limitless. Hold onto your hope, keep fighting, and know that you are stronger than you think. Go forward and shine.`,
                formal: `In conclusion, the variables of success are within your control. Maintain discipline, execute your strategy, and achieve the performance targets you have set. Thank you for your attendance.`,
                persuasive: `The decision is yours. Will you stay where you are, or will you take action and claim your success? The path is clear, and the power is in your hands. Act now.`,
                professional: `In summary, implementing these optimization frameworks will yield measurable improvements in productivity. We look forward to monitoring your progress and supporting your implementation phase. Thank you.`
            },
            general: {
                inspirational: `In closing, let us look to the future with confidence and shared purpose. By bringing the principles of ${kw1} to our work on ${topic}, we can create positive change that will benefit us all. Thank you for your time and attention.`,
                humorous: `Well, that's my take on the subject. I hope I've given you something to think about, or at least a brief distraction from your day. Thank you for listening, and enjoy the rest of the event!`,
                emotional: `Thank you for listening. Let us carry this conversation forward in our daily lives, remembering that our shared understanding of ${topic} is what makes us stronger as a community.`,
                formal: `This concludes my address on ${topic}. I appreciate your attendance and formal consideration of these findings. Thank you.`,
                persuasive: `The choice is before us. We can ignore this issue, or we can choose to lead. I urge you to join me in taking action and making a difference. Thank you.`,
                professional: `In summary, the analysis supports the recommended course of action on ${topic}. We will continue to evaluate metrics and adjust strategies accordingly. Thank you.`
            }
        };

        const catGroup = conclusions[category] || conclusions['general'];
        const conclusionText = catGroup[tone] || catGroup['inspirational'];

        return conclusionText.replace('{relationship}', relationship || 'a speaker')
                             .replace('{topic}', topic)
                             .replace('{audience}', audience)
                             .replace('{kw1}', kw1)
                             .replace('{kw2}', kw2)
                             .replace('{kw3}', kw3);
    }


    // ==========================================================================
    // STATE NAVIGATION / UI SWITCHES
    // ==========================================================================

    function switchState(state) {
        stateEmpty.classList.remove('active');
        stateLoading.classList.remove('active');
        stateResult.classList.remove('active');

        if (state === 'empty') {
            stateEmpty.classList.add('active');
        } else if (state === 'loading') {
            stateLoading.classList.add('active');
        } else if (state === 'result') {
            stateResult.classList.add('active');
        }
    }

    function loadSpeechToEditor(speech) {
        // Update tags
        badgeCategory.textContent = formatString(speech.category);
        badgeTone.textContent = formatString(speech.tone);
        
        // Calculate estimated read time (avg 130 words per minute)
        const wordCount = speech.text.split(/\s+/).length;
        const readTime = Math.max(1, Math.round(wordCount / 130));
        badgeLength.textContent = `~${readTime} Min${readTime > 1 ? 's' : ''} (${wordCount} words)`;

        // Form bindings
        inputTitle.value = speech.title;
        textareaSpeechText.value = speech.text;

        // Reset TTS
        stopTts();
        
        // Save Status Indicator
        indicatorSaveStatus.className = "save-status-indicator saved";
        indicatorSaveStatus.querySelector('span').textContent = "Saved";
    }

    let saveTimeout = null;
    function triggerAutoSave() {
        indicatorSaveStatus.className = "save-status-indicator saving";
        indicatorSaveStatus.querySelector('span').textContent = "Saving...";

        if (saveTimeout) clearTimeout(saveTimeout);

        saveTimeout = setTimeout(() => {
            // Update speech in history array
            const idx = speechHistory.findIndex(item => item.id === currentSpeech.id);
            if (idx !== -1) {
                speechHistory[idx].title = currentSpeech.title;
                speechHistory[idx].text = currentSpeech.text;
                speechHistory[idx].timestamp = Date.now();
                
                // Write back to storage
                saveHistoryToStorage();
                renderHistoryList();
            }

            indicatorSaveStatus.className = "save-status-indicator saved";
            indicatorSaveStatus.querySelector('span').textContent = "Saved";
        }, 800); // 800ms debounce
    }


    // ==========================================================================
    // UTILITY ACTIONS (COPY & DOWNLOAD)
    // ==========================================================================

    function copySpeechToClipboard() {
        const textToCopy = textareaSpeechText.value;
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showToast("Copied to clipboard!", "success");
            })
            .catch(err => {
                console.error("Clipboard copy failed: ", err);
                showToast("Failed to copy text.", "error");
            });
    }

    function downloadSpeechAsFile() {
        const title = inputTitle.value.trim() || 'Speech';
        const text = textareaSpeechText.value;
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Sanitize file name
        const safeName = title.toLowerCase().replace(/[^a-z0-9]/gi, '_') + '.txt';
        
        link.href = url;
        link.download = safeName;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast("Speech file downloaded!", "success");
    }


    // ==========================================================================
    // TEXT-TO-SPEECH (TTS) SYSTEM
    // ==========================================================================

    function setupTtsVoices() {
        if (typeof speechSynthesis === 'undefined') return;

        const voices = speechSynthesis.getVoices();
        selectTtsVoice.innerHTML = '<option value="">Default System Voice</option>';

        // Filter standard voices and sort
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            selectTtsVoice.appendChild(option);
        });
    }

    function toggleTts() {
        if (typeof speechSynthesis === 'undefined') {
            showToast("Text-to-Speech not supported in this browser.", "error");
            return;
        }

        if (isTtsPlaying) {
            if (isTtsPaused) {
                speechSynthesis.resume();
                isTtsPaused = false;
                updateTtsUi(true);
            } else {
                speechSynthesis.pause();
                isTtsPaused = true;
                updateTtsUi(true, true);
            }
        } else {
            playTts(0);
        }
    }

    function playTts(startCharIndex = 0) {
        const text = textareaSpeechText.value;
        if (!text) return;

        // If starting from character index, slice text (Simple boundary adjustment)
        const textToSpeak = startCharIndex > 0 ? text.substring(startCharIndex) : text;

        ttsUtterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Select custom voice if chosen
        const selectedVoiceName = selectTtsVoice.value;
        if (selectedVoiceName) {
            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoiceName);
            if (voice) ttsUtterance.voice = voice;
        }

        // Speed setting
        ttsUtterance.rate = parseFloat(rangeTtsSpeed.value);

        // Events
        ttsUtterance.onstart = () => {
            isTtsPlaying = true;
            isTtsPaused = false;
            updateTtsUi(true);
        };

        ttsUtterance.onend = () => {
            isTtsPlaying = false;
            isTtsPaused = false;
            updateTtsUi(false);
        };

        ttsUtterance.onerror = (e) => {
            // Ignore interruption error because of user stop request
            if (e.error !== 'interrupted') {
                console.error("TTS error:", e);
                showToast("An error occurred during speech reading.", "error");
            }
            isTtsPlaying = false;
            isTtsPaused = false;
            updateTtsUi(false);
        };

        speechSynthesis.speak(ttsUtterance);
    }

    function stopTts() {
        if (typeof speechSynthesis === 'undefined') return;
        speechSynthesis.cancel();
        isTtsPlaying = false;
        isTtsPaused = false;
        updateTtsUi(false);
    }

    function getSpeechTtsPosition() {
        // Fallback simple position retrieval
        return 0;
    }

    function updateTtsUi(playing, paused = false) {
        if (playing) {
            btnTtsStop.removeAttribute('disabled');
            if (paused) {
                btnTtsPlay.querySelector('.tts-text-play').textContent = "Resume Reading";
                btnTtsPlay.className = "btn btn-accent btn-sm";
                // Show play icon
                btnTtsPlay.querySelector('.tts-icon-play').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
            } else {
                btnTtsPlay.querySelector('.tts-text-play').textContent = "Pause Reading";
                btnTtsPlay.className = "btn btn-secondary btn-sm";
                // Show pause icon
                btnTtsPlay.querySelector('.tts-icon-play').innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
            }
        } else {
            btnTtsStop.setAttribute('disabled', 'true');
            btnTtsPlay.querySelector('.tts-text-play').textContent = "Play Speech";
            btnTtsPlay.className = "btn btn-primary btn-sm";
            btnTtsPlay.querySelector('.tts-icon-play').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
        }
    }


    // ==========================================================================
    // PRACTICE MODE (TELEPROMPTER)
    // ==========================================================================

    function startTeleprompter() {
        const text = textareaSpeechText.value;
        if (!text) {
            showToast("Cannot practice empty speech.", "error");
            return;
        }

        // Set state
        isTeleprompterActive = true;
        isTeleprompterScrolling = false;
        
        // Stop TTS if playing
        stopTts();

        // Populate details
        teleprompterTitle.textContent = inputTitle.value.trim() || "Untitled Speech";
        
        const wordCount = text.split(/\s+/).length;
        const readTime = Math.max(1, Math.round(wordCount / 130));
        teleprompterDuration.textContent = `Est. Read Time: ~${readTime} Min${readTime > 1 ? 's' : ''}`;

        // Build HTML paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        teleprompterText.innerHTML = paragraphs.map((p, idx) => {
            return `<p class="teleprompter-p ${idx === 0 ? 'in-focus' : ''}" data-index="${idx}">${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // Apply sliders
        teleprompterText.style.fontSize = `${teleprompterFontSize}px`;
        teleprompterFontSlider.value = teleprompterFontSize;
        teleprompterFontVal.textContent = teleprompterFontSize;

        teleprompterSpeedSlider.value = teleprompterScrollSpeed;
        teleprompterSpeedVal.textContent = teleprompterScrollSpeed;

        // Reset scroll position
        teleprompterScrollContainer.scrollTop = 0;

        // Show Overlay
        teleprompterOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock main screen scroll

        // Reset control play button states
        updateTeleprompterPlayButton(false);
    }

    function closeTeleprompter() {
        // Cancel animation loops
        if (scrollRequestFrame) {
            cancelAnimationFrame(scrollRequestFrame);
            scrollRequestFrame = null;
        }
        
        isTeleprompterActive = false;
        isTeleprompterScrolling = false;
        
        teleprompterOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Unlock main screen scroll
    }

    function toggleTeleprompterScroll() {
        if (!isTeleprompterActive) return;

        if (isTeleprompterScrolling) {
            // Pause
            isTeleprompterScrolling = false;
            updateTeleprompterPlayButton(false);
            if (scrollRequestFrame) {
                cancelAnimationFrame(scrollRequestFrame);
                scrollRequestFrame = null;
            }
        } else {
            // Play
            isTeleprompterScrolling = true;
            updateTeleprompterPlayButton(true);
            lastScrollTime = performance.now();
            scrollRequestFrame = requestAnimationFrame(scrollTeleprompterStep);
        }
    }

    function scrollTeleprompterStep(timestamp) {
        if (!isTeleprompterScrolling) return;

        const elapsed = timestamp - lastScrollTime;
        lastScrollTime = timestamp;

        // Calculate scroll delta based on elapsed time and selected speed factor
        // speed scaling mapping 15 -> roughly 1.5 pixels per frame at 60Hz
        const pixelsPerMs = (teleprompterScrollSpeed * 0.005);
        const scrollDelta = elapsed * pixelsPerMs;

        // Apply scroll
        const currentScroll = teleprompterScrollContainer.scrollTop;
        teleprompterScrollContainer.scrollTop = currentScroll + scrollDelta;

        // Check if reached bottom
        const maxScroll = teleprompterScrollContainer.scrollHeight - teleprompterScrollContainer.clientHeight;
        if (teleprompterScrollContainer.scrollTop >= maxScroll - 1) {
            isTeleprompterScrolling = false;
            updateTeleprompterPlayButton(false);
            showToast("Teleprompter reached the end of the speech.", "info");
        } else {
            scrollRequestFrame = requestAnimationFrame(scrollTeleprompterStep);
        }
    }

    function rewindTeleprompter() {
        // Pause scroll
        if (isTeleprompterScrolling) {
            toggleTeleprompterScroll();
        }
        
        // Scroll back to top
        teleprompterScrollContainer.scrollTop = 0;
        
        // Recalculate focus
        highlightTeleprompterFocusText();
    }

    function updateTeleprompterPlayButton(scrolling) {
        if (scrolling) {
            // Show Pause
            teleprompterPlay.className = "btn btn-secondary btn-round";
            teleprompterPlay.querySelector('.teleprompter-icon-play').innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
        } else {
            // Show Play
            teleprompterPlay.className = "btn btn-primary btn-round";
            teleprompterPlay.querySelector('.teleprompter-icon-play').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
        }
    }

    function highlightTeleprompterFocusText() {
        if (!isTeleprompterActive) return;

        const pNodes = teleprompterText.querySelectorAll('.teleprompter-p');
        const containerRect = teleprompterScrollContainer.getBoundingClientRect();
        const containerMidline = containerRect.top + (containerRect.height / 2);

        let closestIdx = -1;
        let minDistance = Infinity;

        pNodes.forEach((node, idx) => {
            const rect = node.getBoundingClientRect();
            const nodeMidline = rect.top + (rect.height / 2);
            const dist = Math.abs(containerMidline - nodeMidline);

            if (dist < minDistance) {
                minDistance = dist;
                closestIdx = idx;
            }
        });

        // Set visual focus style
        pNodes.forEach((node, idx) => {
            if (idx === closestIdx) {
                node.classList.add('in-focus');
            } else {
                node.classList.remove('in-focus');
            }
        });
    }


    // ==========================================================================
    // LOCAL STORAGE & HISTORY Drawer
    // ==========================================================================

    function loadHistoryFromStorage() {
        try {
            const raw = localStorage.getItem('speechspark_history');
            speechHistory = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Local Storage reading error, resetting history.", e);
            speechHistory = [];
        }
        updateHistoryUiBadge();
    }

    function saveHistoryToStorage() {
        try {
            localStorage.setItem('speechspark_history', JSON.stringify(speechHistory));
        } catch (e) {
            console.error("Local Storage saving failed:", e);
            showToast("Failed to save history items locally.", "error");
        }
        updateHistoryUiBadge();
    }

    function saveSpeechToHistory(speech) {
        // Check if item already exists by some chance and update, otherwise insert at top
        const idx = speechHistory.findIndex(item => item.id === speech.id);
        if (idx !== -1) {
            speechHistory[idx] = { ...speech };
        } else {
            speechHistory.unshift({ ...speech });
        }
        saveHistoryToStorage();
        renderHistoryList();
    }

    function loadSpeechFromHistory(id) {
        const speech = speechHistory.find(item => item.id === id);
        if (speech) {
            currentSpeech = { ...speech };
            loadSpeechToEditor(currentSpeech);
            switchState('result');
            toggleHistoryDrawer(false);
            showToast(`Loaded "${speech.title}"`, "info");
        }
    }

    function deleteSpeechFromHistory(id, event) {
        if (event) event.stopPropagation(); // Avoid triggering list click focus loading

        speechHistory = speechHistory.filter(item => item.id !== id);
        saveHistoryToStorage();
        renderHistoryList();
        showToast("Speech deleted.", "info");

        // If active speech was deleted, reset UI if necessary
        if (currentSpeech.id === id) {
            currentSpeech = { id: null, title: '', text: '', category: 'general', tone: 'inspirational' };
            switchState('empty');
        }
    }

    function clearAllHistory() {
        if (confirm("Are you sure you want to clear all speech drafts from your history? This action cannot be undone.")) {
            speechHistory = [];
            saveHistoryToStorage();
            renderHistoryList();
            currentSpeech = { id: null, title: '', text: '', category: 'general', tone: 'inspirational' };
            switchState('empty');
            showToast("Speech history cleared.", "info");
        }
    }

    function updateHistoryUiBadge() {
        historyBadge.textContent = speechHistory.length;
    }

    function toggleHistoryDrawer(open) {
        isHistoryOpen = open;
        if (open) {
            drawerHistory.classList.add('open');
            renderHistoryList();
        } else {
            drawerHistory.classList.remove('open');
        }
    }

    function renderHistoryList() {
        const query = inputHistorySearch.value.trim().toLowerCase();
        
        // Filter history by search query
        const filtered = speechHistory.filter(speech => {
            return speech.title.toLowerCase().includes(query) ||
                   speech.text.toLowerCase().includes(query) ||
                   speech.category.toLowerCase().includes(query);
        });

        historyList.innerHTML = '';

        if (filtered.length === 0) {
            historyEmptyState.style.display = 'flex';
            return;
        }

        historyEmptyState.style.display = 'none';

        filtered.forEach(speech => {
            const dateStr = new Date(speech.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const li = document.createElement('li');
            li.className = 'history-item';
            li.dataset.id = speech.id;
            li.addEventListener('click', () => loadSpeechFromHistory(speech.id));

            li.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-title" title="${escapeHtml(speech.title)}">${escapeHtml(speech.title)}</span>
                    <button class="btn-item-delete" title="Delete speech text" aria-label="Delete saved speech">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
                <p class="history-item-snippet">${escapeHtml(speech.text)}</p>
                <div class="history-item-footer">
                    <span class="history-item-tag">${formatString(speech.category)}</span>
                    <span>${dateStr}</span>
                </div>
            `;

            // Bind delete click
            const delBtn = li.querySelector('.btn-item-delete');
            delBtn.addEventListener('click', (e) => deleteSpeechFromHistory(speech.id, e));

            historyList.appendChild(li);
        });
    }


    // ==========================================================================
    // TOAST MESSAGING SYSTEM & HELPERS
    // ==========================================================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconMarkup = '';
        if (type === 'success') {
            iconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>';
        } else {
            iconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
        }

        toast.innerHTML = `
            ${iconMarkup}
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Remove trigger
        setTimeout(() => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // Helper to format category/tone slugs
    function formatString(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Escapes special characters for HTML injection safely
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Throttler helper to optimize scroll checking inside teleprompter
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
});
