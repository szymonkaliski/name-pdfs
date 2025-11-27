# `name-pdfs`

Auto-rename PDF files using Claude AI.

## Installation

```bash
npm install -g name-pdfs
```

## Setup

Create `~/.name-pdfs-key` with your Anthropic API key:

```bash
echo "your-api-key-here" > ~/.name-pdfs-key
```

Or set the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Get your API key from: https://console.anthropic.com/

## Usage

```bash
name-pdfs *.pdf
name-pdfs paper.pdf
name-pdfs --debug document.pdf
```

### Options

- `--debug` - Show verbose debug information (full prompts/responses)
- `--help`, `-h` - Show help message
