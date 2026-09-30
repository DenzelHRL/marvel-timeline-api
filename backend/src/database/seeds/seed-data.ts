// Dados iniciais resumidos; slugs e posições tornam os seeds repetíveis.
export const SERIES = [
  {
    slug: 'wandavision',
    titulo: 'WandaVision',
    descricao:
      'Wanda e Visão protagonizam uma história que conecta a fase dos Vingadores aos acontecimentos seguintes.',
  },
  {
    slug: 'falcao-e-o-soldado-invernal',
    titulo: 'Falcão e o Soldado Invernal',
    descricao:
      'Sam Wilson e Bucky Barnes seguem caminhos ligados ao legado do Capitão América.',
  },
  {
    slug: 'loki',
    titulo: 'Loki',
    descricao:
      'Loki atravessa acontecimentos ligados à TVA e às linhas do tempo.',
  },
] as const;

export const OBRAS = [
  {
    slug: 'capitao-america-o-primeiro-vingador',
    titulo: 'Capitão América: O Primeiro Vingador',
    ano: 2011,
    tipo: 'FILME',
    resumo:
      'Durante a Segunda Guerra Mundial, Steve Rogers participa de um experimento que o transforma em um herói.',
  },
  {
    slug: 'homem-de-ferro',
    titulo: 'Homem de Ferro',
    ano: 2008,
    tipo: 'FILME',
    resumo:
      'Após uma experiência que muda sua vida, Tony Stark constrói uma armadura e redefine seu papel no mundo.',
  },
  {
    slug: 'thor',
    titulo: 'Thor',
    ano: 2011,
    tipo: 'FILME',
    resumo:
      'Afastado de Asgard, Thor precisa aprender a agir sem os privilégios de sua antiga posição.',
  },
  {
    slug: 'os-vingadores',
    titulo: 'Os Vingadores',
    ano: 2012,
    tipo: 'FILME',
    resumo:
      'Uma ameaça à Terra leva heróis de origens diferentes a tentar trabalhar como equipe.',
  },
  {
    slug: 'capitao-america-2-o-soldado-invernal',
    titulo: 'Capitão América 2: O Soldado Invernal',
    ano: 2014,
    tipo: 'FILME',
    resumo:
      'Steve Rogers investiga uma conspiração que coloca em dúvida as instituições nas quais confiava.',
  },
  {
    slug: 'guardioes-da-galaxia',
    titulo: 'Guardiões da Galáxia',
    ano: 2014,
    tipo: 'FILME',
    resumo:
      'Um grupo improvável se reúne quando um artefato de enorme poder atrai adversários perigosos.',
  },
  {
    slug: 'vingadores-era-de-ultron',
    titulo: 'Vingadores: Era de Ultron',
    ano: 2015,
    tipo: 'FILME',
    resumo:
      'Uma iniciativa criada para proteger a humanidade se torna uma nova ameaça para os Vingadores.',
  },
  {
    slug: 'homem-formiga',
    titulo: 'Homem-Formiga',
    ano: 2015,
    tipo: 'FILME',
    resumo:
      'Scott Lang aprende a usar uma tecnologia capaz de alterar seu tamanho para cumprir uma missão.',
  },
  {
    slug: 'capitao-america-guerra-civil',
    titulo: 'Capitão América: Guerra Civil',
    ano: 2016,
    tipo: 'FILME',
    resumo: 'Uma disputa sobre a supervisão dos heróis divide antigos aliados.',
  },
  {
    slug: 'doutor-estranho',
    titulo: 'Doutor Estranho',
    ano: 2016,
    tipo: 'FILME',
    resumo:
      'Um cirurgião em busca de respostas descobre uma dimensão da realidade que desconhecia.',
  },
  {
    slug: 'homem-aranha-de-volta-ao-lar',
    titulo: 'Homem-Aranha: De Volta ao Lar',
    ano: 2017,
    tipo: 'FILME',
    resumo:
      'Peter Parker tenta conciliar a escola, sua vida pessoal e as responsabilidades de ser um herói.',
  },
  {
    slug: 'thor-ragnarok',
    titulo: 'Thor: Ragnarok',
    ano: 2017,
    tipo: 'FILME',
    resumo:
      'Thor precisa encontrar aliados para enfrentar uma ameaça que coloca o futuro de Asgard em risco.',
  },
  {
    slug: 'pantera-negra',
    titulo: 'Pantera Negra',
    ano: 2018,
    tipo: 'FILME',
    resumo:
      "T'Challa assume novas responsabilidades enquanto Wakanda enfrenta disputas sobre seu futuro.",
  },
  {
    slug: 'vingadores-guerra-infinita',
    titulo: 'Vingadores: Guerra Infinita',
    ano: 2018,
    tipo: 'FILME',
    resumo:
      'Heróis de vários lugares se unem para impedir que Thanos reúna as Joias do Infinito.',
  },
  {
    slug: 'homem-formiga-e-a-vespa',
    titulo: 'Homem-Formiga e a Vespa',
    ano: 2018,
    tipo: 'FILME',
    resumo:
      'Scott Lang e Hope van Dyne enfrentam uma missão ligada ao Reino Quântico e à família de Hope.',
  },
  {
    slug: 'capita-marvel',
    titulo: 'Capitã Marvel',
    ano: 2019,
    tipo: 'FILME',
    resumo:
      'Carol Danvers investiga sua própria história em meio a um conflito entre povos do espaço.',
  },
  {
    slug: 'vingadores-ultimato',
    titulo: 'Vingadores: Ultimato',
    ano: 2019,
    tipo: 'FILME',
    resumo:
      'Os heróis procuram uma forma de lidar com as consequências do confronto com Thanos.',
  },
  {
    slug: 'wandavision-temporada-1',
    titulo: 'WandaVision — temporada 1',
    ano: 2021,
    tipo: 'TEMPORADA',
    resumo:
      'Wanda e Visão vivem uma rotina aparentemente perfeita, mas percebem que há algo estranho ao redor.',
    serieSlug: 'wandavision',
    temporada: 1,
  },
  {
    slug: 'falcao-e-o-soldado-invernal-temporada-1',
    titulo: 'Falcão e o Soldado Invernal — temporada 1',
    ano: 2021,
    tipo: 'TEMPORADA',
    resumo:
      'Sam Wilson e Bucky Barnes enfrentam novas ameaças enquanto refletem sobre o legado do Capitão América.',
    serieSlug: 'falcao-e-o-soldado-invernal',
    temporada: 1,
  },
  {
    slug: 'loki-temporada-1',
    titulo: 'Loki — temporada 1',
    ano: 2021,
    tipo: 'TEMPORADA',
    resumo:
      'Loki entra em contato com uma organização que monitora interferências nas linhas do tempo.',
    serieSlug: 'loki',
    temporada: 1,
  },
  {
    slug: 'shang-chi-e-a-lenda-dos-dez-aneis',
    titulo: 'Shang-Chi e a Lenda dos Dez Anéis',
    ano: 2021,
    tipo: 'FILME',
    resumo:
      'Shang-Chi precisa lidar com seu passado e com a organização ligada à sua família.',
  },
  {
    slug: 'homem-aranha-sem-volta-para-casa',
    titulo: 'Homem-Aranha: Sem Volta para Casa',
    ano: 2021,
    tipo: 'FILME',
    resumo:
      'Peter Parker procura ajuda para recuperar a vida pessoal depois que sua identidade se torna pública.',
  },
  {
    slug: 'doutor-estranho-no-multiverso-da-loucura',
    titulo: 'Doutor Estranho no Multiverso da Loucura',
    ano: 2022,
    tipo: 'FILME',
    resumo:
      'Doutor Estranho atravessa realidades alternativas e encontra perigos que desafiam o que sabe sobre o multiverso.',
  },
  {
    slug: 'pantera-negra-wakanda-para-sempre',
    titulo: 'Pantera Negra: Wakanda Para Sempre',
    ano: 2022,
    tipo: 'FILME',
    resumo:
      'Wakanda enfrenta pressões externas e precisa decidir como proteger seu povo diante de novos conflitos.',
  },
  {
    slug: 'homem-formiga-e-a-vespa-quantumania',
    titulo: 'Homem-Formiga e a Vespa: Quantumania',
    ano: 2023,
    tipo: 'FILME',
    resumo:
      'Scott Lang e sua família exploram o Reino Quântico e se deparam com forças que desconheciam.',
  },
  {
    slug: 'loki-temporada-2',
    titulo: 'Loki — temporada 2',
    ano: 2023,
    tipo: 'TEMPORADA',
    resumo:
      'Loki e seus aliados tentam compreender mudanças na TVA e o futuro das linhas do tempo.',
    serieSlug: 'loki',
    temporada: 2,
  },
  {
    slug: 'as-marvels',
    titulo: 'As Marvels',
    ano: 2023,
    tipo: 'FILME',
    resumo:
      'Carol Danvers, Monica Rambeau e Kamala Khan precisam cooperar quando seus poderes passam a se conectar.',
  },
  {
    slug: 'x-men',
    titulo: 'X-Men',
    ano: 2000,
    tipo: 'FILME',
    resumo:
      'Em um mundo dividido sobre a existência de mutantes, dois grupos defendem caminhos diferentes para o futuro.',
  },
  {
    slug: 'x-men-2',
    titulo: 'X-Men 2',
    ano: 2003,
    tipo: 'FILME',
    resumo:
      'Uma ameaça aos mutantes força os X-Men a rever alianças e enfrentar um adversário comum.',
  },
  {
    slug: 'deadpool-e-wolverine',
    titulo: 'Deadpool & Wolverine',
    ano: 2024,
    tipo: 'FILME',
    resumo:
      'Wade Wilson e Wolverine se envolvem em uma aventura ligada à TVA e a diferentes realidades.',
  },
  {
    slug: 'capitao-america-admiravel-mundo-novo',
    titulo: 'Capitão América: Admirável Mundo Novo',
    ano: 2025,
    tipo: 'FILME',
    resumo:
      'Sam Wilson investiga uma crise internacional enquanto assume as responsabilidades de Capitão América.',
  },
  {
    slug: 'thunderbolts',
    titulo: 'Thunderbolts*',
    ano: 2025,
    tipo: 'FILME',
    resumo:
      'Um grupo de anti-heróis é forçado a colaborar para sobreviver a uma missão perigosa.',
  },
  {
    slug: 'quarteto-fantastico-primeiros-passos',
    titulo: 'Quarteto Fantástico: Primeiros Passos',
    ano: 2025,
    tipo: 'FILME',
    resumo:
      'Reed, Sue, Johnny e Ben precisam equilibrar seus laços familiares com uma ameaça ao seu mundo.',
  },
  {
    slug: 'homem-aranha-um-novo-dia',
    titulo: 'Homem-Aranha: Um Novo Dia',
    ano: 2026,
    tipo: 'FILME',
    resumo:
      'Peter Parker segue protegendo Nova York enquanto tenta construir uma nova fase de sua vida.',
  },
] as const;

export const ETAPAS_LONGA = [
  {
    slug: 'capitao-america-o-primeiro-vingador',
    posicao: 1,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-de-ferro',
    posicao: 2,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'thor',
    posicao: 3,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'os-vingadores',
    posicao: 4,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'capitao-america-2-o-soldado-invernal',
    posicao: 5,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'guardioes-da-galaxia',
    posicao: 6,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'vingadores-era-de-ultron',
    posicao: 7,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-formiga',
    posicao: 8,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'capitao-america-guerra-civil',
    posicao: 9,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'doutor-estranho',
    posicao: 10,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-aranha-de-volta-ao-lar',
    posicao: 11,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'thor-ragnarok',
    posicao: 12,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'pantera-negra',
    posicao: 13,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'vingadores-guerra-infinita',
    posicao: 14,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-formiga-e-a-vespa',
    posicao: 15,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'capita-marvel',
    posicao: 16,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'vingadores-ultimato',
    posicao: 17,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'wandavision-temporada-1',
    posicao: 18,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'falcao-e-o-soldado-invernal-temporada-1',
    posicao: 19,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'loki-temporada-1',
    posicao: 20,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'shang-chi-e-a-lenda-dos-dez-aneis',
    posicao: 21,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-aranha-sem-volta-para-casa',
    posicao: 22,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'doutor-estranho-no-multiverso-da-loucura',
    posicao: 23,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'pantera-negra-wakanda-para-sempre',
    posicao: 24,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-formiga-e-a-vespa-quantumania',
    posicao: 25,
    prioridade: 'CONTEXTO',
  },
  {
    slug: 'loki-temporada-2',
    posicao: 26,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'as-marvels',
    posicao: 27,
    prioridade: 'CONTEXTO',
  },
  {
    slug: 'x-men',
    posicao: 28,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'x-men-2',
    posicao: 29,
    prioridade: 'CONTEXTO',
  },
  {
    slug: 'deadpool-e-wolverine',
    posicao: 30,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'capitao-america-admiravel-mundo-novo',
    posicao: 31,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'thunderbolts',
    posicao: 32,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'quarteto-fantastico-primeiros-passos',
    posicao: 33,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-aranha-um-novo-dia',
    posicao: 34,
    prioridade: 'CONTEXTO',
  },
] as const;

export const ETAPAS_CURTA = [
  {
    slug: 'vingadores-guerra-infinita',
    posicao: 1,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-formiga-e-a-vespa',
    posicao: 2,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'capita-marvel',
    posicao: 3,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'vingadores-ultimato',
    posicao: 4,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'wandavision-temporada-1',
    posicao: 5,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'falcao-e-o-soldado-invernal-temporada-1',
    posicao: 6,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'loki-temporada-1',
    posicao: 7,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'shang-chi-e-a-lenda-dos-dez-aneis',
    posicao: 8,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-aranha-sem-volta-para-casa',
    posicao: 9,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'doutor-estranho-no-multiverso-da-loucura',
    posicao: 10,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'pantera-negra-wakanda-para-sempre',
    posicao: 11,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-formiga-e-a-vespa-quantumania',
    posicao: 12,
    prioridade: 'CONTEXTO',
  },
  {
    slug: 'loki-temporada-2',
    posicao: 13,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'as-marvels',
    posicao: 14,
    prioridade: 'CONTEXTO',
  },
  {
    slug: 'x-men',
    posicao: 15,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'x-men-2',
    posicao: 16,
    prioridade: 'CONTEXTO',
  },
  {
    slug: 'deadpool-e-wolverine',
    posicao: 17,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'capitao-america-admiravel-mundo-novo',
    posicao: 18,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'thunderbolts',
    posicao: 19,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'quarteto-fantastico-primeiros-passos',
    posicao: 20,
    prioridade: 'PRINCIPAL',
  },
  {
    slug: 'homem-aranha-um-novo-dia',
    posicao: 21,
    prioridade: 'CONTEXTO',
  },
] as const;

export const PERMISSOES = [
  {
    codigo: 'comentarios:criar',
    descricao: 'Publicar um comentário em uma obra',
  },
  {
    codigo: 'comentarios:editar_proprio',
    descricao: 'Editar o próprio comentário',
  },
  {
    codigo: 'comentarios:remover_proprio',
    descricao: 'Remover o próprio comentário',
  },
  {
    codigo: 'comentarios:moderar',
    descricao: 'Ocultar ou republicar comentários na moderação',
  },
  {
    codigo: 'conta:consultar_propria',
    descricao: 'Consultar os próprios dados',
  },
  {
    codigo: 'conta:editar_propria',
    descricao: 'Editar dados permitidos da própria conta',
  },
  {
    codigo: 'progresso:consultar_proprio',
    descricao: 'Consultar o próprio progresso',
  },
  {
    codigo: 'progresso:alterar_proprio',
    descricao: 'Criar ou alterar o próprio progresso',
  },
  {
    codigo: 'series:criar',
    descricao: 'Cadastrar uma série',
  },
  {
    codigo: 'series:editar',
    descricao: 'Editar ou mudar o status de uma série',
  },
  {
    codigo: 'obras:criar',
    descricao: 'Cadastrar uma obra ou temporada',
  },
  {
    codigo: 'obras:editar',
    descricao: 'Editar ou mudar o status de uma obra',
  },
  {
    codigo: 'trilhas:criar',
    descricao: 'Cadastrar uma trilha',
  },
  {
    codigo: 'trilhas:editar',
    descricao: 'Editar ou mudar o status de uma trilha',
  },
  {
    codigo: 'etapas:editar',
    descricao: 'Incluir, retirar ou reordenar etapas de uma trilha',
  },
  {
    codigo: 'personagens:criar',
    descricao: 'Cadastrar um personagem',
  },
  {
    codigo: 'personagens:editar',
    descricao: 'Editar um personagem',
  },
  {
    codigo: 'participacoes:editar',
    descricao:
      'Incluir, editar ou retirar a participação de um personagem em uma obra',
  },
  {
    codigo: 'acontecimentos:criar',
    descricao: 'Cadastrar um acontecimento',
  },
  {
    codigo: 'acontecimentos:editar',
    descricao: 'Editar ou retirar um acontecimento e seus vínculos',
  },
  {
    codigo: 'usuarios:consultar_todos',
    descricao: 'Consultar a lista de usuários para administração',
  },
  {
    codigo: 'usuarios:alterar_status',
    descricao: 'Ativar ou desativar outra conta',
  },
  {
    codigo: 'usuarios:editar',
    descricao: 'Editar dados permitidos de outra conta',
  },
  {
    codigo: 'acessos:atribuir_perfil',
    descricao: 'Dar um perfil a outra conta',
  },
  {
    codigo: 'acessos:revogar_perfil',
    descricao: 'Retirar um perfil de outra conta',
  },
  {
    codigo: 'acessos:alterar_permissoes',
    descricao: 'Alterar os vínculos entre perfis e permissões',
  },
] as const;

export const PERSONAGENS = [
  {
    slug: 'thanos',
    nome: 'Thanos',
    descricao: 'Figura poderosa que busca controlar as Joias do Infinito.',
  },
  {
    slug: 'tony-stark',
    nome: 'Tony Stark',
    descricao: 'Inventor que usa uma armadura para atuar como Homem de Ferro.',
  },
  {
    slug: 'steve-rogers',
    nome: 'Steve Rogers',
    descricao: 'Soldado associado ao legado do Capitão América.',
  },
  {
    slug: 'thor',
    nome: 'Thor',
    descricao: 'Herói asgardiano que enfrenta ameaças à Terra e a seu povo.',
  },
  {
    slug: 'wanda-maximoff',
    nome: 'Wanda Maximoff',
    descricao: 'Heroína com habilidades extraordinárias.',
  },
  {
    slug: 'visao',
    nome: 'Visão',
    descricao: 'Ser sintético ligado aos Vingadores.',
  },
  {
    slug: 'agatha-harkness',
    nome: 'Agatha Harkness',
    descricao: null,
  },
  {
    slug: 'loki',
    nome: 'Loki',
    descricao:
      'Personagem asgardiano ligado a Thor e a acontecimentos temporais.',
  },
  {
    slug: 'mobius',
    nome: 'Mobius',
    descricao: 'Agente associado à Autoridade de Variância Temporal.',
  },
  {
    slug: 'sylvie',
    nome: 'Sylvie',
    descricao: 'Figura relacionada às linhas do tempo.',
  },
  {
    slug: 'aquele-que-permanece',
    nome: 'Aquele que Permanece',
    descricao: null,
  },
  {
    slug: 'reed-richards',
    nome: 'Reed Richards',
    descricao:
      'Integrante do Quarteto Fantástico com habilidades de elasticidade.',
  },
  {
    slug: 'sue-storm',
    nome: 'Sue Storm',
    descricao:
      'Integrante do Quarteto Fantástico com poderes ligados à invisibilidade.',
  },
  {
    slug: 'johnny-storm',
    nome: 'Johnny Storm',
    descricao: 'Integrante do Quarteto Fantástico associado a poderes de fogo.',
  },
  {
    slug: 'ben-grimm',
    nome: 'Ben Grimm',
    descricao: 'Integrante do Quarteto Fantástico com grande força física.',
  },
  {
    slug: 'galactus',
    nome: 'Galactus',
    descricao: 'Ameaça cósmica enfrentada pelo Quarteto Fantástico.',
  },
] as const;

export const PARTICIPACOES = [
  {
    obraSlug: 'vingadores-guerra-infinita',
    personagemSlug: 'thanos',
    papel: 'ANTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    personagemSlug: 'tony-stark',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    personagemSlug: 'steve-rogers',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    personagemSlug: 'thor',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    personagemSlug: 'wanda-maximoff',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    personagemSlug: 'visao',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: 'Visão morre durante a disputa pela Joia da Mente.',
  },
  {
    obraSlug: 'wandavision-temporada-1',
    personagemSlug: 'wanda-maximoff',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'wandavision-temporada-1',
    personagemSlug: 'visao',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'wandavision-temporada-1',
    personagemSlug: 'agatha-harkness',
    papel: 'ANTAGONISTA',
    presencaSpoiler: true,
    desfecho: null,
  },
  {
    obraSlug: 'loki-temporada-1',
    personagemSlug: 'loki',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'loki-temporada-1',
    personagemSlug: 'mobius',
    papel: 'COADJUVANTE',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'loki-temporada-1',
    personagemSlug: 'sylvie',
    papel: 'COADJUVANTE',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'loki-temporada-1',
    personagemSlug: 'aquele-que-permanece',
    papel: 'COADJUVANTE',
    presencaSpoiler: true,
    desfecho: 'Sylvie mata Aquele que Permanece no fim da temporada.',
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    personagemSlug: 'reed-richards',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    personagemSlug: 'sue-storm',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    personagemSlug: 'johnny-storm',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    personagemSlug: 'ben-grimm',
    papel: 'PROTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    personagemSlug: 'galactus',
    papel: 'ANTAGONISTA',
    presencaSpoiler: false,
    desfecho: null,
  },
] as const;

export const ACONTECIMENTOS = [
  {
    obraSlug: 'vingadores-guerra-infinita',
    posicao: 1,
    titulo: 'Heróis se mobilizam',
    descricao:
      'Grupos de heróis agem em diferentes lugares para impedir a busca de Thanos pelas Joias.',
    categoria: 'CONFLITO',
    spoiler: false,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    posicao: 2,
    titulo: 'O destino de Visão',
    descricao:
      'Thanos toma a Joia da Mente de Visão, que morre durante o confronto.',
    categoria: 'DESFECHO',
    spoiler: true,
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    posicao: 3,
    titulo: 'O estalo',
    descricao:
      'Thanos usa as Joias reunidas para executar seu plano contra a vida no universo.',
    categoria: 'DESFECHO',
    spoiler: true,
  },
  {
    obraSlug: 'wandavision-temporada-1',
    posicao: 1,
    titulo: 'Uma vida em Westview',
    descricao:
      'Wanda e Visão vivem uma rotina que parece pertencer a uma comédia de televisão.',
    categoria: 'CONTEXTO',
    spoiler: false,
  },
  {
    obraSlug: 'wandavision-temporada-1',
    posicao: 2,
    titulo: 'A identidade de Agnes',
    descricao:
      'Agnes revela ser Agatha Harkness, ligada aos acontecimentos de Westview.',
    categoria: 'REVELACAO',
    spoiler: true,
  },
  {
    obraSlug: 'loki-temporada-1',
    posicao: 1,
    titulo: 'Loki conhece a TVA',
    descricao:
      'Loki entra em contato com uma organização que acompanha interferências nas linhas do tempo.',
    categoria: 'ENCONTRO',
    spoiler: false,
  },
  {
    obraSlug: 'loki-temporada-1',
    posicao: 2,
    titulo: 'A figura por trás da TVA',
    descricao:
      'Loki e Sylvie encontram Aquele que Permanece na Cidadela no Fim do Tempo.',
    categoria: 'REVELACAO',
    spoiler: true,
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    posicao: 1,
    titulo: 'A ameaça de Galactus',
    descricao:
      'O Quarteto Fantástico se organiza diante de um perigo cósmico para seu mundo.',
    categoria: 'AMEACA',
    spoiler: false,
  },
] as const;

export const ACONTECIMENTO_PERSONAGENS = [
  {
    obraSlug: 'vingadores-guerra-infinita',
    posicao: 1,
    personagens: ['thanos', 'tony-stark', 'steve-rogers', 'thor'],
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    posicao: 2,
    personagens: ['thanos', 'wanda-maximoff', 'visao'],
  },
  {
    obraSlug: 'vingadores-guerra-infinita',
    posicao: 3,
    personagens: ['thanos'],
  },
  {
    obraSlug: 'wandavision-temporada-1',
    posicao: 1,
    personagens: ['wanda-maximoff', 'visao'],
  },
  {
    obraSlug: 'wandavision-temporada-1',
    posicao: 2,
    personagens: ['wanda-maximoff', 'agatha-harkness'],
  },
  {
    obraSlug: 'loki-temporada-1',
    posicao: 1,
    personagens: ['loki', 'mobius'],
  },
  {
    obraSlug: 'loki-temporada-1',
    posicao: 2,
    personagens: ['loki', 'sylvie', 'aquele-que-permanece'],
  },
  {
    obraSlug: 'quarteto-fantastico-primeiros-passos',
    posicao: 1,
    personagens: [
      'reed-richards',
      'sue-storm',
      'johnny-storm',
      'ben-grimm',
      'galactus',
    ],
  },
] as const;
