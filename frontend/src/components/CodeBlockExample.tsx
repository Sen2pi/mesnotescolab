import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CodeBlock from './CodeBlock';

const CodeBlockExample: React.FC = () => {
  const examples = [
    {
      language: 'javascript',
      code: `// Exemplo de JavaScript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log('Fibonacci de 10:', result);

// Arrow function com destructuring
const users = [
  { id: 1, name: 'João', age: 25 },
  { id: 2, name: 'Maria', age: 30 }
];

const userNames = users.map(({ name }) => name);
console.log('Nomes:', userNames);`
    },
    {
      language: 'python',
      code: `# Exemplo de Python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

result = fibonacci(10)
print(f'Fibonacci de 10: {result}')

# List comprehension
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers if x % 2 == 0]
print(f'Quadrado dos pares: {squares}')

# Type hints
from typing import List, Optional

def process_data(data: List[int]) -> Optional[int]:
    if not data:
        return None
    return sum(data) / len(data)`
    },
    {
      language: 'java',
      code: `// Exemplo de Java
public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        int result = fibonacci(10);
        System.out.println("Fibonacci de 10: " + result);
        
        // Stream API
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
        List<Integer> squares = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .collect(Collectors.toList());
        
        System.out.println("Quadrado dos pares: " + squares);
    }
}`
    },
    {
      language: 'cpp',
      code: `// Exemplo de C++
#include <iostream>
#include <vector>
#include <algorithm>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int result = fibonacci(10);
    std::cout << "Fibonacci de 10: " << result << std::endl;
    
    // Lambda expressions
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::vector<int> squares;
    
    std::copy_if(numbers.begin(), numbers.end(), 
                 std::back_inserter(squares),
                 [](int n) { return n % 2 == 0; });
    
    std::transform(squares.begin(), squares.end(), 
                   squares.begin(),
                   [](int n) { return n * n; });
    
    return 0;
}`
    },
    {
      language: 'rust',
      code: `// Exemplo de Rust
fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    let result = fibonacci(10);
    println!("Fibonacci de 10: {}", result);
    
    // Iterator methods
    let numbers = vec![1, 2, 3, 4, 5];
    let squares: Vec<u32> = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();
    
    println!("Quadrado dos pares: {:?}", squares);
}`
    },
    {
      language: 'go',
      code: `// Exemplo de Go
package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    result := fibonacci(10)
    fmt.Printf("Fibonacci de 10: %d\\n", result)
    
    // Slices e maps
    numbers := []int{1, 2, 3, 4, 5}
    squares := make([]int, 0)
    
    for _, num := range numbers {
        if num%2 == 0 {
            squares = append(squares, num*num)
        }
    }
    
    fmt.Printf("Quadrado dos pares: %v\\n", squares)
}`
    },
    {
      language: 'sql',
      code: `-- Exemplo de SQL
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados
INSERT INTO users (name, email) VALUES
    ('João Silva', 'joao@example.com'),
    ('Maria Santos', 'maria@example.com'),
    ('Pedro Costa', 'pedro@example.com');

-- Consulta com JOIN
SELECT 
    u.name,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.name
HAVING post_count > 0
ORDER BY post_count DESC;`
    },
    {
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exemplo HTML</title>
    <style>
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .card {
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Meu Site</h1>
            <nav>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">Sobre</a></li>
                    <li><a href="#contact">Contato</a></li>
                </ul>
            </nav>
        </header>
        
        <main>
            <section class="card">
                <h2>Bem-vindo!</h2>
                <p>Este é um exemplo de HTML semântico.</p>
            </section>
        </main>
    </div>
</body>
</html>`
    },
    {
      language: 'css',
      code: `/* Exemplo de CSS */
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-family);
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    padding: 20px;
    margin: 20px 0;
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
    transform: scale(1.05);
}`
    },
    {
      language: 'yaml',
      code: `# Exemplo de YAML
version: '3.8'

services:
  app:
    image: node:18-alpine
    container_name: my-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    container_name: my-db
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: my-redis
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge`
    },
    {
      language: 'json',
      code: `{
  "name": "mesnotescolab",
  "version": "1.0.0",
  "description": "Aplicação de notas colaborativas",
  "main": "index.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "build": "webpack --mode production",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "eslint": "^8.47.0",
    "prettier": "^3.0.2",
    "webpack": "^5.88.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/user/mesnotescolab.git"
  },
  "keywords": [
    "notes",
    "collaboration",
    "markdown",
    "real-time"
  ],
  "author": "Seu Nome",
  "license": "MIT"
}`
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Exemplos de Blocos de Código com Cores por Linguagem
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Demonstração das melhorias implementadas no componente CodeBlock:
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {examples.map((example, index) => (
          <Paper key={index} elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {example.language.toUpperCase()}
            </Typography>
            <CodeBlock 
              code={example.code} 
              language={example.language} 
              showLineNumbers={true}
            />
          </Paper>
        ))}
      </Box>
      
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          ✨ Melhorias Implementadas:
        </Typography>
        <ul>
          <li>🎨 <strong>Cores específicas</strong> para cada linguagem de programação</li>
          <li>🌙 <strong>Temas dinâmicos</strong> que se adaptam ao modo claro/escuro</li>
          <li>🚫 <strong>Background transparente</strong> - sem fundo branco no texto</li>
          <li>📱 <strong>Interface melhorada</strong> com indicadores visuais de linguagem</li>
          <li>🔧 <strong>Suporte expandido</strong> para mais de 50 linguagens</li>
          <li>💫 <strong>Estilos CSS personalizados</strong> para melhor legibilidade</li>
        </ul>
      </Box>
    </Box>
  );
};

export default CodeBlockExample; 