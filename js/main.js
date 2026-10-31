/* ===========================
   PBL 模块评估 · 主逻辑
   =========================== */
(function () {
  // 五个评估维度
  const DIMENSIONS = [
    { key: 'realWorld',     label: 'Real-World',    max: 5 },
    { key: 'inquiry',       label: 'Inquiry',       max: 5 },
    { key: 'scaffolding',   label: 'Scaffolding',   max: 5 },
    { key: 'assessment',    label: 'Assessment',    max: 5 },
    { key: 'collaboration', label: 'Collaboration', max: 5 }
  ];

  // 写死的模拟分数 [4,3,4,4,3]
  const SCORES = [4, 3, 4, 4, 3];

  // ---------- API 调用配置（接入 OpenAI / DeepSeek 时使用） ----------
  // temperature 强制为 0，消除模型随机性，保证同一份文本每次输出的分数绝对一致。
  const API_CONFIG = {
    endpoint: 'https://api.deepseek.com/chat/completions', // 或 OpenAI 兼容网关
    model: 'deepseek-chat',                                // 或 gpt-4o / gpt-4o-mini
    temperature: 0,                                         // 锁定：0 = 确定性输出
    top_p: 1,
    max_tokens: 4096,
    response_format: { type: 'json_object' }                // 要求返回结构化 JSON
  };

  // ---------- System Prompt：强制通读 + 证据链 ----------
  const SYSTEM_PROMPT = [
    '你是一个严格的 PBL（Project-Based Learning）课程评估专家。',
    '你的任务是根据提供的 Handbook 文本，对以下五个维度进行 1–5 分的评分：',
    '  1. Real-World Grounding and Project Framing',
    '  2. Inquiry and Project Development',
    '  3. Scaffolding and Learning Design',
    '  4. Assessment and Feedback for Learning',
    '  5. Collaboration, Co-Creation, and Resource Integration',
    '',
    '【强制思考顺序 — 必须严格遵守】',
    'Step 1 — 通读：必须完整阅读整篇 Handbook，不允许跳过任何段落。',
    'Step 2 — 找证据：在给出任何分数之前，你必须先针对每一个维度，',
    '  从 Handbook 原文中摘录一段至少 10 个英文单词的原文引用（Evidence Quote），',
    '  并用引号标注。引用必须是 Handbook 中真实存在的句子，绝对禁止凭空捏造、改写或翻译。',
    'Step 3 — 打分：只有在找到该维度的有效原文引用后，才能根据引用内容与 Rubric 等级描述',
    '  的匹配程度给出 1–5 分。如果某个维度在 Handbook 中找不到任何相关证据，直接给 1 分，',
    '  并在 Evidence 字段中写明 "No relevant evidence found in the handbook."。',
    '',
    '【硬性规则】',
    '- 绝对禁止凭空捏造 Evidence 或引用 Handbook 中不存在的内容。',
    '- 每个维度的 Evidence 必须包含原文引号片段，且不少于 10 个英文单词。',
    '- 先输出五个维度的 Evidence（含原文引用），再输出五个维度的 Score。',
    '- 分数只能是 1、2、3、4、5 中的整数，不允许小数。',
    '',
    '【输出格式 — 严格 JSON】',
    '{',
    '  "results": [',
    '    { "dimension": "Real-World", "score": <1-5>, "evidence": "<含原文引号的依据>" },',
    '    { "dimension": "Inquiry", "score": <1-5>, "evidence": "..." },',
    '    { "dimension": "Scaffolding", "score": <1-5>, "evidence": "..." },',
    '    { "dimension": "Assessment", "score": <1-5>, "evidence": "..." },',
    '    { "dimension": "Collaboration", "score": <1-5>, "evidence": "..." }',
    '  ]',
    '}',
    '只输出 JSON，不要输出任何解释性文字。'
  ].join('\n');

  // ---------- 模拟 API 调用函数（接入真实接口时替换内部实现） ----------
  // 入参：handbookText（用户提交的文本）
  // 返回：{ results: [{ dimension, score, evidence }, ...] }
  // 当前为 mock 实现，直接返回写死的 SCORES + EVIDENCE。
  function callAssessmentAPI(handbookText) {
    // —— 真实接入示例（取消注释并替换 API_KEY 即可）——
    // return fetch(API_CONFIG.endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer ' + API_KEY
    //   },
    //   body: JSON.stringify({
    //     model: API_CONFIG.model,
    //     temperature: API_CONFIG.temperature,
    //     top_p: API_CONFIG.top_p,
    //     max_tokens: API_CONFIG.max_tokens,
    //     response_format: API_CONFIG.response_format,
    //     messages: [
    //       { role: 'system', content: SYSTEM_PROMPT },
    //       { role: 'user', content: handbookText }
    //     ]
    //   })
    // }).then(function (r) { return r.json(); })
    //   .then(function (data) {
    //     return JSON.parse(data.choices[0].message.content);
    //   });

    // 当前 Mock：直接返回写死的结果
    return Promise.resolve({
      results: DIMENSIONS.map(function (d, i) {
        return { dimension: d.label, score: SCORES[i], evidence: EVIDENCE[d.key] };
      })
    });
  }

  // 五个维度对应的 Handbook 原文引用片段（用于 Evidence 卡片展示 + 左侧高亮联动）
  const QUOTES = {
    realWorld: 'Students will identify a real environmental challenge facing the local neighborhood and develop a prototype solution to be presented to the city council at the end of the semester.',
    inquiry: 'Each team must follow the three-phase investigation framework (Observe, Hypothesize, Test) and submit a weekly progress report aligned with the milestones defined in the syllabus.',
    scaffolding: 'Bi-weekly peer critique sessions, reflective journal prompts, and one-to-one faculty check-ins are scheduled at every stage of the project to support teams as they navigate complexity and revise their approach.',
    assessment: 'Students will be assessed on their investigation process, iteration of solutions, collaboration quality, and reflection — not only the final deliverable — using a capability-based rubric shared at the start of the course.',
    collaboration: 'Students will work in teams of four, dividing roles among project manager, researcher, designer, and presenter, and will hold weekly team meetings to coordinate tasks.'
  };

  // 写死的英文模拟评估依据（含 Handbook 原文引用片段，模拟完整证据链）
  const EVIDENCE = {
    realWorld:
      'The handbook explicitly anchors the project in an authentic community context. ' +
      'Evidence quote: "' + QUOTES.realWorld + '" ' +
      'This demonstrates strong real-world grounding, as the project goes beyond classroom simulation and ' +
      'requires engagement with external stakeholders and a genuine audience beyond the teacher.',
    inquiry:
      'The handbook provides structured investigation checkpoints but limits open-ended exploration. ' +
      'Evidence quote: "' + QUOTES.inquiry + '" ' +
      'While students gather and analyze information, the inquiry pathway remains largely predefined, ' +
      'leaving limited room for student-driven questioning, experimentation, or iterative refinement of ideas.',
    scaffolding:
      'The learning process is intentionally scaffolded through integrated milestones and feedback loops. ' +
      'Evidence quote: "' + QUOTES.scaffolding + '" ' +
      'These structures provide adaptive support that helps students manage uncertainty while preserving ' +
      'their ownership of project direction and decision-making.',
    assessment:
      'Assessment is developmental and embedded throughout the project rather than outcome-focused. ' +
      'Evidence quote: "' + QUOTES.assessment + '" ' +
      'Multiple feedback opportunities allow students to refine their work based on evidence, ' +
      'supporting meaningful learning and growth over the duration of the project.',
    collaboration:
      'Teams coordinate effectively but underutilize cross-disciplinary and external resources. ' +
      'Evidence quote: "' + QUOTES.collaboration + '" ' +
      'While internal coordination is clear, the handbook does not explicitly require engagement with ' +
      'external stakeholders, AI-assisted tools, or cross-disciplinary expertise, limiting the depth ' +
      'of co-creation and resource integration possible.'
  };

  // ---------- 文档解析（真实读取 .docx / .pdf 全文） ----------
  let parsedFileText = ''; // 存储上传文件解析出的真实全文

  // 解析 .docx（mammoth 优先；失败时回退到直接解压 word/document.xml 提取 <w:t>）
  function parseDocx(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;

        // 兜底方案：直接解压 word/document.xml，按段落提取 <w:t> 文本并解码 XML 实体
        function fallbackRaw() {
          if (typeof JSZip === 'undefined') {
            return Promise.reject(new Error('JSZip 未加载，无法兜底解析'));
          }
          return JSZip.loadAsync(arrayBuffer).then(function (zip) {
            const docFile = zip.file('word/document.xml');
            if (!docFile) return '';
            return docFile.async('string').then(function (xml) {
              // 用浏览器原生 DOM 解码 XML 实体（&amp; &lt; &gt; &#...; 等）
              function decodeEntities(s) {
                const div = document.createElement('div');
                div.innerHTML = s;
                return div.textContent || div.innerText || '';
              }
              // 按 </w:p> 切分段落，段内提取所有 <w:t>
              const paragraphs = xml.split(/<\/w:p>/);
              const out = [];
              paragraphs.forEach(function (para) {
                const matches = para.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
                const line = matches.map(function (m) {
                  return decodeEntities(m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''));
                }).join('');
                if (line && line.trim()) out.push(line);
              });
              return out.join('\n\n');
            });
          });
        }

        // 首选 mammoth；若未加载、抛错或返回空文本，则走兜底
        let primary;
        if (typeof mammoth === 'undefined') {
          primary = Promise.reject(new Error('mammoth 未加载'));
        } else {
          primary = mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function (result) { return (result && result.value) || ''; })
            .catch(function () { return ''; });
        }

        primary.then(function (text) {
          if (text && text.trim().length > 0) return text;
          return fallbackRaw();
        }).then(resolve).catch(reject);
      };
      reader.onerror = function () { reject(new Error('文件读取失败')); };
      reader.readAsArrayBuffer(file);
    });
  }

  // 解析 .pdf（使用 pdf.js，逐页提取并按页码顺序拼接）
  function parsePdf(file) {
    return new Promise(function (resolve, reject) {
      if (typeof pdfjsLib === 'undefined') {
        reject(new Error('pdf.js 库未加载'));
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        const typedarray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument({ data: typedarray }).promise.then(function (pdf) {
          const numPages = pdf.numPages;
          const pagePromises = [];
          for (let i = 1; i <= numPages; i++) {
            pagePromises.push(
              pdf.getPage(i).then(function (page) {
                return page.getTextContent().then(function (content) {
                  const text = content.items.map(function (item) { return item.str; }).join('');
                  return { page: i, text: text };
                });
              }).catch(function () { return { page: i, text: '' }; })
            );
          }
          Promise.all(pagePromises).then(function (pages) {
            pages.sort(function (a, b) { return a.page - b.page; });
            const fullText = pages.map(function (p) { return p.text; }).join('\n\n');
            resolve(fullText);
          }).catch(reject);
        }).catch(reject);
      };
      reader.onerror = function () { reject(new Error('文件读取失败')); };
      reader.readAsArrayBuffer(file);
    });
  }

  // 解析 .pptx（使用 JSZip 解压，读取 ppt/slides/slide*.xml，提取所有 <a:t> 文本）
  function parsePptx(file) {
    return new Promise(function (resolve, reject) {
      if (typeof JSZip === 'undefined') {
        reject(new Error('JSZip 库未加载'));
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        JSZip.loadAsync(e.target.result).then(function (zip) {
          // 收集所有幻灯片 XML 文件（ppt/slides/slideN.xml），按页码排序
          const slideFiles = Object.keys(zip.files)
            .filter(function (name) {
              return /^ppt\/slides\/slide\d+\.xml$/.test(name);
            })
            .sort(function (a, b) {
              const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
              const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
              return na - nb;
            });

          const slidePromises = slideFiles.map(function (name) {
            return zip.file(name).async('string').then(function (xml) {
              // 提取所有 <a:t>...</a:t> 标签内的文字
              const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
              const texts = matches.map(function (m) {
                return m.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '');
              });
              return texts.join('');
            }).catch(function () { return ''; });
          });

          return Promise.all(slidePromises).then(function (slides) {
            // 每页幻灯片之间用空行分隔，保留阅读顺序
            const fullText = slides.filter(Boolean).join('\n\n');
            resolve(fullText);
          });
        }).catch(reject);
      };
      reader.onerror = function () { reject(new Error('文件读取失败')); };
      reader.readAsArrayBuffer(file);
    });
  }

  // 根据扩展名分发到对应解析器
  function handleFile(file) {
    const name = file.name.toLowerCase();
    let parser;
    if (name.endsWith('.docx')) parser = parseDocx;
    else if (name.endsWith('.pdf')) parser = parsePdf;
    else if (name.endsWith('.pptx')) parser = parsePptx;
    else {
      parsedFileText = '';
      setPreviewMessage('仅支持 .docx、.pdf 和 .pptx 格式文件。');
      setWordCount(0);
      return Promise.resolve('');
    }
    // 超大文件直接提示，避免前端解析卡死
    if (file.size > 20 * 1024 * 1024) {
      parsedFileText = '';
      setPreviewMessage('解析失败或文件过长，请尝试使用文本输入');
      setWordCount(0);
      return Promise.resolve('');
    }
    setPreviewMessage('正在解析文档，提取全文，请稍候…');
    setWordCount(-1); // 解析中状态
    return parser(file).then(function (text) {
      parsedFileText = text || '';
      if (!parsedFileText.trim()) {
        // 解析流程未报错但未提取到任何文字
        setPreviewMessage('解析失败或文件过长，请尝试使用文本输入');
        setWordCount(0);
        return '';
      }
      renderPreviewText(parsedFileText);
      setWordCount(parsedFileText.length); // 解析成功，更新为真实字数
      return parsedFileText;
    }).catch(function (err) {
      console.error('文档解析失败：', err);
      parsedFileText = '';
      setPreviewMessage('解析失败或文件过长，请尝试使用文本输入');
      setWordCount(0);
      return '';
    });
  }

  // HTML 转义，防止注入
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // DOM 引用
  const textarea   = document.getElementById('handbook');
  const counterEl  = document.getElementById('counter');
  const assessBtn  = document.getElementById('assessBtn');
  const btnLabel   = document.getElementById('btnLabel');
  const hint       = document.getElementById('hint');
  const emptyState = document.getElementById('emptyState');
  const scoresBox  = document.getElementById('scores');
  const statusEl   = document.getElementById('status');
  const statusText = document.getElementById('statusText');

  const tabBtns    = document.querySelectorAll('.tab-btn');
  const tabPanels  = document.querySelectorAll('.tab-panel');
  const fileInput  = document.getElementById('fileInput');
  const dropzone   = document.getElementById('dropzone');
  const fileName   = document.getElementById('fileName');
  const urlInput   = document.getElementById('urlInput');
  const previewBody = document.getElementById('previewBody');

  let chart = null;
  let activeTab = 'text';

  // ---------- Tab 切换 ----------
  function switchTab(tab) {
    activeTab = tab;
    tabBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    tabPanels.forEach(function (p) {
      p.classList.toggle('active', p.dataset.tab === tab);
    });
    updateCounter();
    hint.classList.remove('show');
    if (chart) chart.resize();
  }

  tabBtns.forEach(function (b) {
    b.addEventListener('click', function () { switchTab(b.dataset.tab); });
  });

  // ---------- 状态栏计数 ----------
  function updateCounter() {
    if (activeTab === 'text') {
      counterEl.innerHTML = '<b>' + textarea.value.length.toLocaleString('en-US') + '</b> 字符';
    } else if (activeTab === 'file') {
      if (parsingState === 'loading') {
        counterEl.innerHTML = '正在解析文档…';
      } else if (parsedFileText) {
        counterEl.innerHTML = '当前真实解析字数：<b>' + parsedFileText.length.toLocaleString('en-US') + '</b> 字';
      } else {
        const f = fileInput.files && fileInput.files[0];
        counterEl.innerHTML = f ? '已选择：' + f.name : '未选择文件';
      }
    } else {
      counterEl.innerHTML = urlInput.value.trim()
        ? '<b>' + urlInput.value.length + '</b> 字符'
        : '未输入网址';
    }
  }

  // 预览区渲染：真实文本（已转义），按空行分段，不做任何假高亮处理
  function renderPreviewText(text) {
    const body = document.getElementById('previewBody');
    if (!body) return;
    if (!text) {
      setPreviewMessage('暂无内容，请上传文档或输入文本。');
      return;
    }
    // 按空行分段，保留换行与段落间距
    const paragraphs = escapeHtml(text).split(/\n\n+/).map(function (p) {
      return '<p>' + p.replace(/\n/g, '<br/>') + '</p>';
    }).join('');
    body.innerHTML = '<div class="reader-content">' + paragraphs + '</div>';
  }

  // 预览区显示一条提示消息
  function setPreviewMessage(msg) {
    const body = document.getElementById('previewBody');
    if (body) body.innerHTML = '<p class="preview-empty">' + escapeHtml(msg) + '</p>';
  }

  // 设置解析字数状态：-1 = 解析中，0 = 空，>0 = 真实字数
  let parsingState = 'idle'; // idle | loading | done
  function setWordCount(n) {
    if (n === -1) {
      parsingState = 'loading';
    } else {
      parsingState = n > 0 ? 'done' : 'idle';
    }
    updateCounter();
  }

  textarea.addEventListener('input', function () {
    updateCounter();
    if (textarea.value.trim()) hint.classList.remove('show');
    renderPreviewText(textarea.value);
  });

  urlInput.addEventListener('input', function () {
    updateCounter();
    if (urlInput.value.trim()) hint.classList.remove('show');
    renderPreviewText(urlInput.value);
  });

  // ---------- 文件选择 / 拖拽 ----------
  fileInput.addEventListener('change', function () {
    const f = fileInput.files && fileInput.files[0];
    if (f) {
      fileName.textContent = '已选择文件：' + f.name;
      fileName.classList.add('show');
      hint.classList.remove('show');
      handleFile(f); // 真实解析 .docx / .pdf
    } else {
      fileName.textContent = '';
      fileName.classList.remove('show');
      parsedFileText = '';
      setWordCount(0);
      setPreviewMessage('评估完成后，此处将显示 Handbook 原文。');
    }
    updateCounter();
  });

  ['dragenter', 'dragover'].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'dragend', 'drop'].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });

  // ---------- 输入校验 ----------
  function getInputStatus() {
    if (activeTab === 'text') {
      return { ok: textarea.value.trim() !== '', focus: textarea, msg: '请先粘贴 Handbook 文本' };
    }
    if (activeTab === 'file') {
      // 必须成功解析出文本才算有效
      if (parsingState === 'loading') {
        return { ok: false, focus: dropzone, msg: '文档正在解析中，请稍候…' };
      }
      return {
        ok: !!parsedFileText,
        focus: dropzone,
        msg: parsedFileText ? '' : '请先上传并成功解析 .docx / .pdf 文件'
      };
    }
    return { ok: urlInput.value.trim() !== '', focus: urlInput, msg: '请输入有效的网址' };
  }

  // ---------- ECharts 雷达图配置 ----------
  function buildOption(values) {
    return {
      animationDuration: 900,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15,45,94,.94)',
        borderWidth: 0,
        padding: [8, 12],
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: function (p) {
          return p.name + '<br/>' + DIMENSIONS.map(function (d, i) {
            return d.label + '：<b>' + p.value[i] + '</b> / 5';
          }).join('<br/>');
        }
      },
      radar: {
        center: ['50%', '53%'],
        radius: '64%',
        splitNumber: 5,
        shape: 'polygon',
        indicator: DIMENSIONS.map(function (d) {
          return { name: d.label, max: d.max };
        }),
        axisName: {
          color: '#1b2f4f',
          fontSize: 13,
          fontWeight: 600,
          padding: [3, 4]
        },
        axisLabel: {
          show: true,
          color: '#93a3bb',
          fontSize: 10.5,
          formatter: function (v) { return v; }
        },
        splitLine: { lineStyle: { color: '#d9e6f8', width: 1 } },
        splitArea: {
          areaStyle: {
            color: ['rgba(244,249,255,.92)', 'rgba(255,255,255,.86)']
          }
        },
        axisLine: { lineStyle: { color: '#cfdef5' } }
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#2563eb', width: 2.4 },
        itemStyle: { color: '#1d4ed8', borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.85, [
            { offset: 0, color: 'rgba(59,130,246,.16)' },
            { offset: 1, color: 'rgba(59,130,246,.42)' }
          ])
        },
        emphasis: { lineStyle: { width: 3 } },
        data: [{ value: values, name: '当前评估' }]
      }]
    };
  }

  // ---------- 渲染分数条 ----------
  function renderScores(values) {
    scoresBox.innerHTML = '';
    DIMENSIONS.forEach(function (d, i) {
      const chip = document.createElement('div');
      chip.className = 'score-chip';
      chip.innerHTML =
        '<div class="name"><span>' + d.label + '</span><span class="val">' + values[i] + '/5</span></div>' +
        '<div class="track"><div class="fill"></div></div>';
      scoresBox.appendChild(chip);

      const fill = chip.querySelector('.fill');
      const width = (values[i] / d.max) * 100 + '%';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fill.style.width = width; });
      });
    });
    scoresBox.classList.add('show');
  }

  // ---------- 获取当前输入的文本（用于传给 API） ----------
  function getHandbookText() {
    if (activeTab === 'text') return textarea.value;
    if (activeTab === 'url') return urlInput.value;
    // 文件：返回真实解析出的全文
    return parsedFileText || '';
  }

  // ---------- 渲染详细解析卡片 ----------
  // results: [{ dimension, score, evidence }, ...]
  function renderAnalysis(results) {
    const list = document.getElementById('analysisList');
    const empty = document.getElementById('analysisEmpty');
    list.innerHTML = '';
    results.forEach(function (r, i) {
      const card = document.createElement('div');
      card.className = 'a-card';
      card.innerHTML =
        '<div class="a-card-head">' +
          '<span class="a-card-name">Dimension ' + (i + 1) + ': ' + r.dimension + '</span>' +
          '<span class="a-card-score">Score: ' + r.score + '</span>' +
        '</div>' +
        '<div class="a-card-evidence"><b>Evidence:</b> ' + r.evidence + '</div>';
      list.appendChild(card);
    });
    empty.style.display = 'none';
  }

  function ensureChart() {
    if (!chart) chart = echarts.init(document.getElementById('radar'));
    return chart;
  }

  // ---------- 开始评估 ----------
  function runAssessment() {
    const st = getInputStatus();
    if (!st.ok) {
      hint.textContent = st.msg;
      hint.classList.add('show');
      if (st.focus && typeof st.focus.focus === 'function') st.focus.focus();
      return;
    }

    hint.classList.remove('show');
    assessBtn.disabled = true;
    assessBtn.classList.add('loading');
    btnLabel.textContent = '正在评估...';
    statusEl.classList.remove('done');
    statusText.textContent = '分析文本中';

    const handbookText = getHandbookText();

    // 模拟 1.5 秒等待后调用评估 API（当前为 Mock，返回写死的 SCORES + EVIDENCE）
    setTimeout(function () {
      callAssessmentAPI(handbookText).then(function (data) {
        const results = data.results || [];
        const values = results.map(function (r) { return r.score; });

        emptyState.classList.add('hidden');
        const c = ensureChart();
        c.setOption(buildOption(values), true);
        c.resize();

        renderScores(values);
        renderAnalysis(results);

        assessBtn.disabled = false;
        assessBtn.classList.remove('loading');
        btnLabel.textContent = '重新评估';
        statusEl.classList.add('done');
        statusText.textContent = '评估完成 · 模拟数据';
      }).catch(function (err) {
        console.error('Assessment API error:', err);
        hint.textContent = '评估失败，请稍后重试';
        hint.classList.add('show');
        assessBtn.disabled = false;
        assessBtn.classList.remove('loading');
        btnLabel.textContent = '开始评估';
        statusText.textContent = '评估失败';
      });
    }, 1500);
  }

  assessBtn.addEventListener('click', runAssessment);

  // ---------- 图表尺寸自适应 ----------
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (chart) chart.resize(); }, 160);
  });
})();
