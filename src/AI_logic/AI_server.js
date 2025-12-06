var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
require('dotenv').config();
var express = require('express');
var cors = require('cors');
var CohereClientV2 = require('cohere-ai').CohereClientV2;
var InferenceClient = require('@huggingface/inference').InferenceClient;
var app = express();
app.use(cors());
app.use(express.json());
var port = process.env.PORT || 3000;
var co = new CohereClientV2({ token: process.env.CO_API_KEY });
var client = new InferenceClient(process.env.HF_TOKEN);
function summarizeUsingCohere(text) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, co.chat({
                        model: "command-a-03-2025",
                        messages: [{ role: "user", content: instruction(text, true) }]
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, (response.message.content[0].text)];
            }
        });
    });
}
;
function summarizeUsingDistilbart(text) {
    return __awaiter(this, void 0, void 0, function () {
        var output;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.summarization({
                        model: "sshleifer/distilbart-cnn-12-6",
                        inputs: instruction(text, false),
                        provider: "hf-inference"
                    })];
                case 1:
                    output = _a.sent();
                    return [2 /*return*/, (output.summary_text)];
            }
        });
    });
}
;
var instruction = function (text, main) {
    var instructions;
    if (main) {
        instructions = "\n        You are an intelligent summarizer for educational material (research papers, textbooks, or student notes). \n        Produce a **short, clear, simple, student-friendly summary** in **plain text** that will render well in a browser.\n\n        Requirements:\n        1. Explain the material in **simple language**, as if teaching a student, avoiding complex terms unless necessary.\n        2. Keep the summary **short and concise**, focusing only on the most important facts, dates, achievements, and concepts.\n        3. Start with a **brief paragraph** summarizing the main ideas in an easy-to-understand way.\n        4. Add **key points below the paragraph**, each on a **new line** with a simple bullet or dash, but keep them minimal.\n        5. Use **natural spacing, line breaks, and indentation** for readability on a web page.\n        6. Do **not** include labels like \"Document Type\", \"Summary\", headings, mindmaps, or Markdown syntax.\n\n        Use your own style for spacing and formatting so it looks clean and readable in a browser.\n\n        Here is the text to summarize:\n        ".concat(text, "\n        ");
    }
    else {
        instructions = text;
    }
    return instructions;
};
app.post('/summarize', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var text, feedBack, err_1, swap, fallbackErr_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                text = req.body.text;
                if (text === 'whoami') {
                    return [2 /*return*/, (res.json({ summary: "I am Markie, an AI model trained by Makky." }))];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 8]);
                return [4 /*yield*/, summarizeUsingCohere(text)];
            case 2:
                feedBack = _c.sent();
                res.json({ summary: feedBack });
                return [3 /*break*/, 8];
            case 3:
                err_1 = _c.sent();
                console.error(err_1.statusCode, ((_a = err_1.body) === null || _a === void 0 ? void 0 : _a.message) || err_1.message);
                swap = [404, 429, 500].includes(err_1.statusCode);
                if (!swap) return [3 /*break*/, 7];
                // If the error is due to a 404, 429, or 500 status code, switch to Distilbart
                console.log('Switching to the Distilbart model');
                _c.label = 4;
            case 4:
                _c.trys.push([4, 6, , 7]);
                return [4 /*yield*/, summarizeUsingDistilbart(text)];
            case 5:
                feedBack = _c.sent();
                return [2 /*return*/, res.json({ summary: feedBack })];
            case 6:
                fallbackErr_1 = _c.sent();
                console.log('Both models failed!');
                console.error(((_b = fallbackErr_1.body) === null || _b === void 0 ? void 0 : _b.message) || fallbackErr_1.message);
                return [2 /*return*/, res.status(500).json({ Error: "An issue occured when summarizing text" })];
            case 7: return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
app.listen(port, function () {
    console.log("Server running on port ".concat(port));
});
