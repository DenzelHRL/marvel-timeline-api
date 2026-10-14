# Ordem das trilhas

As trilhas usam a ordem dos acontecimentos da história principal de cada obra, e não o ano de lançamento. Flashbacks, viagens no tempo e cenas pós-créditos não são usados para deslocar o filme inteiro.

A curta preserva as 21 obras selecionadas, incluindo Capitã Marvel como contexto inicial. A longa preserva as 34 obras selecionadas. A longa é uma seleção ampliada, não um catálogo completo de tudo que a Marvel lançou.

## Histórias de outras linhas do tempo

Não existe uma cronologia única que permita comparar todos os universos pela mesma data. Por isso, estas posições são escolhas de navegação da trilha:

- As duas temporadas de Loki ficam juntas após Ultimato, acompanhando a sequência da própria série. A posição não significa que tudo na TVA aconteça antes de WandaVision.
- X-Men e X-Men 2 formam um bloco de contexto antes de Deadpool & Wolverine. Não são acontecimentos posteriores a As Marvels na Terra dos Vingadores.
- Quarteto Fantástico: Primeiros Passos encerra a seleção como um bloco de outro universo, com ambientação inspirada nos anos 1960. Não acontece depois de Um Novo Dia na mesma Terra.
- Um Novo Dia fica no trecho final da linha principal, após Thunderbolts*. A sinopse da Sony informa que se passa quatro anos após Sem Volta para Casa; sua posição relativa a Thunderbolts* é uma decisão provisória da trilha, não uma data exata confirmada por essa sinopse.

Essas exceções não transformam a lista em uma ordem de lançamento. A linha principal segue a cronologia; os blocos do multiverso têm encaixes explicados acima. A seleção também não garante que estas sejam todas as obras necessárias para entender Doutor Destino.

## Trilha longa

1. Capitão América: O Primeiro Vingador
2. Capitã Marvel
3. Homem de Ferro
4. Thor
5. Os Vingadores
6. Capitão América 2: O Soldado Invernal
7. Guardiões da Galáxia
8. Vingadores: Era de Ultron
9. Homem-Formiga
10. Capitão América: Guerra Civil
11. Pantera Negra
12. Homem-Aranha: De Volta ao Lar
13. Doutor Estranho
14. Thor: Ragnarok
15. Homem-Formiga e a Vespa
16. Vingadores: Guerra Infinita
17. Vingadores: Ultimato
18. Loki — temporada 1
19. Loki — temporada 2
20. WandaVision — temporada 1
21. Shang-Chi e a Lenda dos Dez Anéis
22. Falcão e o Soldado Invernal — temporada 1
23. Homem-Aranha: Sem Volta para Casa
24. Doutor Estranho no Multiverso da Loucura
25. Pantera Negra: Wakanda Para Sempre
26. Homem-Formiga e a Vespa: Quantumania
27. As Marvels
28. X-Men
29. X-Men 2
30. Deadpool & Wolverine
31. Capitão América: Admirável Mundo Novo
32. Thunderbolts*
33. Homem-Aranha: Um Novo Dia
34. Quarteto Fantástico: Primeiros Passos

## Trilha curta

1. Capitã Marvel
2. Homem-Formiga e a Vespa
3. Vingadores: Guerra Infinita
4. Vingadores: Ultimato
5. Loki — temporada 1
6. Loki — temporada 2
7. WandaVision — temporada 1
8. Shang-Chi e a Lenda dos Dez Anéis
9. Falcão e o Soldado Invernal — temporada 1
10. Homem-Aranha: Sem Volta para Casa
11. Doutor Estranho no Multiverso da Loucura
12. Pantera Negra: Wakanda Para Sempre
13. Homem-Formiga e a Vespa: Quantumania
14. As Marvels
15. X-Men
16. X-Men 2
17. Deadpool & Wolverine
18. Capitão América: Admirável Mundo Novo
19. Thunderbolts*
20. Homem-Aranha: Um Novo Dia
21. Quarteto Fantástico: Primeiros Passos

## Aplicar a correção no banco local

Depois que o PR desta correção estiver integrado à main, atualize sua branch com a main. Dentro de backend, execute uma linha por vez:

```bash
npm run db:migrate
npm run db:seed
npm run db:verify
```

A nova migration atualiza posições existentes em uma transação, sem excluir e recriar etapas. Os IDs, vínculos com obras, prioridades, justificativas e status das obras são preservados. A faixa temporária de posições evita colisões com a restrição de unicidade. Bancos novos recebem a mesma ordem pelos seeds.

Se uma das duas trilhas tiver uma seleção personalizada, com etapas adicionadas ou removidas, a migration interrompe com uma mensagem e reverte a transação. Nesse caso, revise essa seleção antes de aplicar a correção. Não apague o banco para contornar o aviso.

A correção é executada uma vez pelo histórico de migrations. Rodar o seed novamente não deve desfazer uma reordenação administrativa posterior. As posições no seed são a ordem inicial para bancos novos.

Para conferir no Swagger, consulte `/trilhas/curta/etapas?pagina=1&limite=3`: o início deve ser Capitã Marvel, Homem-Formiga e a Vespa e Guerra Infinita. O mapa usa a mesma posição das etapas e acompanha a alteração automaticamente.

## Referências para a ordem e as exceções

- [Disney Brasil: ordem cronológica](https://www.disney.com.br/novidades/universo-marvel-qual-a-ordem-cronologica-dos-filmes-e-series-no-disney-plus). Lista publicada em 2022; não cobre todos os títulos posteriores e pode divergir de revisões recentes de posições próximas.
- [Marvel: linha do tempo no Disney+](https://www.marvel.com/articles/movies/mcu-timeline-order-disney-plus). Referência para acompanhar atualizações; a ordenação pode ser revisada ao longo do tempo.
- [Disney+: contagem regressiva para Doutor Destino](https://www.disneyplus.com/en-gb/explore/articles/countdown-to-avengers-doomsday), com Loki situado a partir de Ultimato e contextualização do multiverso.
- [Marvel: Quarteto Fantástico e seu próprio universo](https://www.marvel.com/articles/movies/fantastic-four-first-steps-avengers-doomsday-kevin-feige?pubDate=20250808).
- [Sony: sinopse de Um Novo Dia](https://www.sonypictures.com.br/index.php/filmes/homem-aranha-um-novo-dia).
