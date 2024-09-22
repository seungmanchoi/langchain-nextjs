# Next.js Chatbot Project

This project demonstrates various chatbot implementations using **Next.js**, **Tailwind CSS**, and **LangChain.js**. The project covers several chatbot examples including a simple chatbot, role-based chatbot, prompt template-based chatbot, conversation history-aware chatbot, and RAG (Retrieval-Augmented Generation) chatbot.

## Description

The Next.js Chatbot Project showcases different approaches to building chatbots using modern web technologies. By utilizing Next.js for server-side rendering, Tailwind CSS for styling, and LangChain.js for managing language model interactions, this project provides a comprehensive set of examples to help developers build powerful and versatile chatbots.

## Features

- **Simple Chatbot**: A basic chatbot that responds directly to user inputs.
- **Role-Based Chatbot**: A chatbot that assigns specific roles to the model, such as translator or assistant, guiding its responses.
- **Prompt Template-Based Chatbot**: A chatbot that uses predefined templates to format and manage prompts, allowing dynamic input and context control.
- **Conversation History Chatbot**: A chatbot that remembers past interactions, maintaining context across multiple messages to create a more natural conversation flow.
- **RAG-Based Chatbot**: A chatbot that combines retrieval techniques with generative models, integrating external knowledge sources to enhance response accuracy and relevance.

## Tech Stack

- **Next.js**: A React framework for building server-side rendered and static web applications.
- **Tailwind CSS**: A utility-first CSS framework that enables rapid UI development with a mobile-first approach.
- **LangChain.js**: A JavaScript library for building applications that interact with language models, providing tools for chaining and managing prompts effectively.

## Getting Started

### Prerequisites

- **Node.js**: Make sure you have Node.js installed (v20+ recommended).
- **npm**: Node package manager, which is required for installing dependencies.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/seungmanchoi/langchain-nextjs.git
   cd langchain-nextjs
   ```

2. Install dependencies:

   ```bash
   npm install
   ```
   
3. Set up environment variables:

   ```bash
   MODEL=your_model_name(openai, gemini)
   ```
   
### Running the Project
To start the development server:

   ```bash
   npm run dev
   ```

Navigate to http://localhost:3000/bot to see the application in action.

## Example Implementations
### 1. Simple Chatbot
A straightforward chatbot that directly responds to user inputs using a basic language model.

### 2. Role-Based Chatbot
Assigns specific roles to the model, such as translator or advisor, by using system messages to set behavior.

### 3. Prompt Template-Based Chatbot
Uses `ChatPromptTemplate` to manage and format messages with dynamic input, allowing flexible and reusable prompt structures.

### 4. Conversation History Chatbot
Maintains context by remembering previous interactions, enabling more coherent and context-aware responses.

### 5. RAG-Based Chatbot
Combines retrieval techniques with generative models, integrating external knowledge sources to enhance response accuracy.

## File Structure
```
├── interfaces/                # TypeScript interfaces
├── pages/
│   ├── bot.tsx                # bot entry point of the application
│   └── api/                   # Backend API endpoints
├── styles/
│   └── globals.css            # Global styles including Tailwind CSS
└── README.md                  # Project documentation
```

## License
This project is licensed under the MIT License.

## Contact
For questions or suggestions, please reach out to <blueng.choi@gmail.com>