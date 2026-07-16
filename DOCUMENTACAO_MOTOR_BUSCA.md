# Documentação do Motor de Pesquisa de Preços Públicos

Este documento detalha o funcionamento, arquitetura e objetivos do Motor de Pesquisa de Preços Públicos integrado ao sistema.

## Objetivo
O objetivo principal do Motor de Pesquisa de Preços é automatizar e estruturar a coleta de valores de referência para contratações públicas, utilizando dados reais do Portal Nacional de Contratações Públicas (PNCP). O motor visa garantir conformidade com a Lei nº 14.133/2021 e normativas correlatas (como a IN SEGES/ME nº 65/2021), assegurando que os preços estimados para as licitações sejam justos, baseados no mercado atual, e expurgados de valores inexequíveis ou excessivamente altos.

## Arquitetura e Tipo de Código
O motor foi desenvolvido em **TypeScript** e executado no ambiente Node.js (via servidor backend/Express), interagindo com:
1. **API do Gemini (Google GenAI):** Utilizada como o "cérebro" semântico para entender descrições humanas, traduzi-las para estratégias de busca, e por fim redigir o relatório analítico.
2. **API do PNCP (Portal Nacional de Contratações Públicas):** Fonte oficial de dados brutos de compras, atas e contratos homologados no Brasil.
3. **Proxy Interno (`/api/pncp-proxy`):** Para contornar limitações de CORS e efetuar as chamadas HTTP com tentativas de repetição (retry) e segurança.

## Como o Motor Funciona (Passo a Passo)

O fluxo de funcionamento do motor de busca é composto por 4 etapas principais:

### 1. Tradução e Expansão Semântica (IA)
Quando a pesquisa de preços é solicitada para uma lista de itens, o sistema não faz uma busca direta (e falha) pelas descrições exatas. Em vez disso, ele utiliza a inteligência artificial para agir como o "Cérebro" do motor de busca:
- **Classificação:** O item é classificado como `material_simples`, `material_tecnico`, `servico_comum` ou `servico_complexo`.
- **Extração Estruturada:** A descrição complexa é quebrada em:
  - **Termo Principal:** A essência do produto (ex: "cabo cobre").
  - **Atributos Obrigatórios:** Características vitais (ex: "35mm").
  - **Atributos Opcionais:** Detalhes secundários (ex: "flexível").
- **Expansões de Busca:** A IA gera sinônimos e variações de palavras-chave para garantir que os editais e atas corretos sejam encontrados no PNCP.

### 2. Busca e Coleta de Dados (PNCP)
Com as estratégias geradas, o motor faz requisições iterativas à API de busca do PNCP:
- O sistema percorre os tipos de documentos (`edital`, `ata`, `contrato`) para ampliar a base de dados.
- Ao encontrar licitações correspondentes, ele acessa o detalhamento de cada compra para verificar os itens e seus resultados (fornecedor vencedor e preço homologado).

### 3. Sistema de Pontuação (Score Multi-Tiered)
Para evitar que itens muito diferentes distorçam o preço, um sistema de **Score de Similaridade** foi implementado:
- **Score de Texto (Peso de 70%):** 
  - O "Termo Principal" contribui com 50% do score de texto.
  - O acerto nos "Atributos Obrigatórios" contribui com 40%. A ausência total de acerto nestes atributos gera uma penalidade severa (redução de 50% do score de texto).
  - O acerto nos "Atributos Opcionais" contribui com 10%.
- **Score de Unidade de Medida (Peso de 30%):** Compara a unidade esperada (ex: UN, M, KG) com a unidade do PNCP. Equivalências lógicas (ex: "m" e "metro") são tratadas com pontuação máxima, enquanto unidades incompatíveis recebem penalidade.
- Apenas resultados com um score final satisfatório (>= 0.6) são incluídos como amostras válidas.

### 4. Saneamento Estatístico (Remoção de Outliers)
Após coletar todas as amostras que passaram no crivo do Score, aplica-se o rigor estatístico exigido pelas normativas:
- **Método IQR (Intervalo Interquartil):** Uma fórmula matemática robusta é aplicada ao conjunto de preços de cada item. Ela descobre o 1º Quartil (Q1) e o 3º Quartil (Q3), calcula a variação e estabelece limites inferiores e superiores. Preços fora destes limites são considerados "outliers" (valores inexequíveis, muito baixos, ou abusivos, muito altos) e são **descartados**.
- **Cálculo da Mediana:** Com as amostras limpas e válidas, o motor encontra a Mediana dos valores, que servirá como o valor de referência oficial e final para o documento.

### 5. Geração do Relatório Oficial (IA)
Finalmente, com todos os preços higienizados, o motor aciona o modelo Gemini novamente. A IA recebe a lista de itens, as estatísticas (amostras válidas, amostras descartadas, e mediana), e os detalhes dos fornecedores e links do PNCP. Ela então redige um **Relatório de Pesquisa de Preços Públicos** completo em Markdown, formatado nos padrões exigidos pela Administração Pública.

## Detalhes Técnicos e Robustez

- **Tratamento de Links:** O código possui heurísticas avançadas para montar links públicos (`https://pncp.gov.br/app/...`) a partir do número de controle do PNCP, garantindo que o servidor público tenha acesso direto aos documentos-fonte.
- **Resiliência:** Utilização da função `fetchWithRetry` garante que falhas momentâneas da API do PNCP (bastante comuns) sejam toleradas, tentando novamente até 3 vezes com pequenos atrasos entre elas.
- **Normalização de Texto:** Diacríticos, acentos e caracteres especiais são expurgados na comparação das descrições, garantindo que "açúcar" dê *match* perfeito com "acucar".

---
Este motor combina Engenharia de Dados Clássica (Estatística e Filtros) com Inteligência Artificial Generativa para resolver a barreira de complexidade da Pesquisa de Preços, oferecendo auditoria contínua, precisão extrema e automação sem precedentes ao setor de compras públicas.
