// Add these modifications to admin-stage1-editor.js

// At the top of the file, expose the editor instance globally for integration
window.editor = null;

// Modify the initializeEditor function to expose the editor
function initializeEditor(initialContent) {
    const textArea = document.getElementById('text-editor');
    if (!textArea) {
        console.error("Text editor element (#text-editor) not found!");
        return;
    }

    if (typeof CodeMirror === 'undefined') {
        console.error("CodeMirror library not found! Check CDN links in HTML.");
        textArea.value = "Error: CodeMirror failed to load.";
        textArea.style.color = 'red';
        textArea.style.backgroundColor = '#fee';
        return;
    }

    try {
        editor = CodeMirror.fromTextArea(textArea, {
            lineNumbers: true,
            mode: null,
            theme: 'default',
            lineWrapping: true,
            autofocus: true,
            extraKeys: {
                "Enter": function(cm) {
                    const cursor = cm.getCursor();
                    const lineContent = cm.getLine(cursor.line);
                    const trimmedLine = lineContent.trim();

                    const abcdOptionMatch = trimmedLine.match(/^(\*?)([A-Z])(\.)/i);
                    const trueFalseOptionMatch = trimmedLine.match(/^(\*?)([a-z])(\))/i);
                    const questionMatch = trimmedLine.match(/^Câu\s*\d+\s*:/i);

                    let nextLinePrefix = '';

                    if (abcdOptionMatch) {
                        const currentLetter = abcdOptionMatch[2].toUpperCase();
                        if (currentLetter < 'D') {
                            nextLinePrefix = String.fromCharCode(currentLetter.charCodeAt(0) + 1) + '. ';
                        } else {
                            nextLinePrefix = '\n';
                        }
                    } else if (trueFalseOptionMatch) {
                        const currentLetter = trueFalseOptionMatch[2].toLowerCase();
                        nextLinePrefix = String.fromCharCode(currentLetter.charCodeAt(0) + 1) + ') ';
                    } else if (questionMatch) {
                        nextLinePrefix = 'A. ';
                    } else if (cursor.line > 0) {
                         const prevLineContent = cm.getLine(cursor.line - 1)?.trim();
                         if (prevLineContent) {
                             const prevAbcdMatch = prevLineContent.match(/^(\*?)([A-Z])\.\s*/i);
                             const prevTrueFalseMatch = prevLineContent.match(/^(\*?)([a-z])\)\s*/i);
                             const prevQuestionMatch = prevLineContent.match(/^Câu\s*\d+\s*:/i);
                             const prevPointsMatch = prevLineContent.match(/^\[\d+\s*pts?\s*\]$/i);

                             if (prevAbcdMatch) {
                                 const prevLetter = prevAbcdMatch[2].toUpperCase();
                                 if (prevLetter < 'D') {
                                     nextLinePrefix = String.fromCharCode(prevLetter.charCodeAt(0) + 1) + '. ';
                                 } else {
                                     nextLinePrefix = '\n';
                                 }
                             } else if (prevTrueFalseMatch) {
                                 const prevLetter = prevTrueFalseMatch[2].toLowerCase();
                                 nextLinePrefix = String.fromCharCode(prevLetter.charCodeAt(0) + 1) + ') ';
                             } else if (prevQuestionMatch || prevPointsMatch) {
                                 nextLinePrefix = 'A. ';
                             }
                         }
                    }

                    cm.replaceSelection('\n' + nextLinePrefix);

                },
                "Shift-Enter": function(cm) {
                    cm.replaceSelection('\n');
                },
                "Tab": function(cm) {
                     cm.replaceSelection("  ");
                }
            }
        });

        // IMPORTANT: Expose editor globally
        window.editor = editor;

        editor.setValue(initialContent || '');

        let debounceTimer;
        editor.on('change', (cm, change) => {
            clearTimeout(debounceTimer);
            if (change.origin !== 'setValue' && change.origin !== 'paste' && change.origin !== 'undo' && change.origin !== 'redo' && change.origin !== '+input') {
            }
            debounceTimer = setTimeout(() => {
                const currentText = cm.getValue();
                const parsed = parseQuizText(currentText);
                updatePreview(parsed);
                applySyntaxHighlighting(cm);
            }, 300);
        });

        const initialParsed = parseQuizText(initialContent);
        updatePreview(initialParsed);
        applySyntaxHighlighting(editor);

        setTimeout(() => {
             if (editor) editor.refresh();
        }, 150);

        // Add event listener for when content is inserted via upload
        editor.on('setValue', () => {
            console.log('Editor content updated via setValue');
            // Trigger parsing and preview update
            const currentText = editor.getValue();
            const parsed = parseQuizText(currentText);
            updatePreview(parsed);
            applySyntaxHighlighting(editor);
        });

    } catch (err) {
        console.error("Error initializing CodeMirror:", err);
        textArea.value = `Error initializing CodeMirror: ${err.message}`;
        textArea.style.color = 'red';
        textArea.style.backgroundColor = '#fee';
    }
}

// Add a trigger method to the editor for external updates
if (window.editor) {
    window.editor.trigger = function(eventName) {
        if (eventName === 'change') {
            const currentText = this.getValue();
            const parsed = parseQuizText(currentText);
            updatePreview(parsed);
            applySyntaxHighlighting(this);
        }
    };
}