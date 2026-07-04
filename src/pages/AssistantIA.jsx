import ClientAIAssistant_Claude from '../components/ClientAIAssistant_Claude';

export default function AssistantIA() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Assistant IA</h1>
      <p className="text-gray-400">Votre assistant intelligent disponible 24h/24.</p>
      <ClientAIAssistant_Claude />
    </div>
  );
}