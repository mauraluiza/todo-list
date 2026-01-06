// Configuração do Supabase
// Preencha com suas credenciais obtidas no painel do Supabase

const PROJECT_URL = 'https://hykuoiwrowbatfwnemry.supabase.co';
const PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3VvaXdyb3diYXRmd25lbXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjM4NDQsImV4cCI6MjA4MzI5OTg0NH0.bc2AjNKkQFrn7GSl7nGaW6x0cak7_iZ4qkXEzn0SJkE';

// Verifica se as credenciais foram preenchidas
const isConfigured = PROJECT_URL.startsWith('https://') && PROJECT_ANON_KEY.length > 20;

// Tenta obter o createClient da variável global exposta pelo CDN
// A lib do CDN geralmente define 'supabase' ou 'Supabase'
const supabaseLib = window.supabase || window.Supabase;
const createClientFn = supabaseLib?.createClient;

if (createClientFn && isConfigured) {
    // Inicializa cliente globalmente
    // Sobrescrevemos window.supabase para ser a instância do cliente, facilitando o uso no script.js
    window.supabase = createClientFn(PROJECT_URL, PROJECT_ANON_KEY);
    console.log('Supabase configurado e inicializado com sucesso.');
    // alert('Conexão com Supabase estabelecida! O login deve aparecer.');
} else {
    // Se falhar, garantimos que seja null para o modo offline funcionar
    // Mas não sobrescrevemos se a lib existir e a config estiver errada, para não quebrar tudo.
    // Melhor: se não configurado, definimos CLIENTE como null.
    // Mas se a lib está lá (window.supabase), deixamos ela quieta? 
    // O script.js espera que window.supabase seja o CLIENTE (com .auth). A lib não tem .auth direto.
    // Então vamos setar null para evitar erros.
    window.supabase = null;

    if (!isConfigured) {
        console.log('Supabase: Credenciais não configuradas.');
    } else if (!createClientFn) {
        console.error('Supabase: Biblioteca não carregada. Verifique sua conexão ou bloqueadores de anúncio.');
        alert('Erro: A biblioteca do Supabase não carregou. O login não funcionará.');
    }
}
