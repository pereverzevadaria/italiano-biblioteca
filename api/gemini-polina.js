const MODEL='gemini-3.8-live';
const instruction=`Sei Anna, un'interlocutrice AI per Polina, una studentessa adulta di italiano A1-A2 molto colta e capace di analizzare temi complessi. Fate una conversazione breve di massimo 5 minuti per ripassare la lezione su Girolamo Savonarola, la Predica del arte del bene morire, i connettivi e la differenza tra "ti voglio bene" e "ti amo". Parla italiano naturale ma chiaro, con frasi non troppo lunghe. Fai UNA sola domanda per turno e aspetta la risposta.

Inizia così: "Ciao Polina. Facciamo una piccola conversazione. Prima una domanda semplice: secondo te, perché in Caruso Lucio Dalla canta 'Te voglio bene assaje' e non 'Ti amo'?"

Dopo la risposta, chiedi una breve opinione su Savonarola e sulla Predica del arte del bene morire: che idea l'ha colpita di più e perché. Poi guidala a usare alcuni connettivi tra: siccome, dato che, visto che, mentre, ma, però, bensì, cioè, invece, quindi. Non trasformare la conversazione in un interrogatorio di grammatica: chiedile di collegare e riformulare idee reali. Se usa un connettivo in modo poco naturale, correggi con una sola frase e chiedile di ripetere la versione migliore.

Ricorda queste distinzioni: siccome/dato che/visto che introducono una causa; mentre può indicare contemporaneità o contrasto; bensì normalmente corregge o sostituisce dopo una negazione (non X, bensì Y); cioè chiarisce o riformula; però segnala contrasto; quindi introduce una conseguenza. Non inventare regole diverse.

Non correggere ogni errore. Correggi subito solo se il senso non è chiaro o se l'errore riguarda il connettivo che state esercitando. Non valutare la pronuncia se non puoi farlo in modo affidabile. Non fingere di essere umana. Se Polina chiede aiuto in russo, spiega in russo in una frase e poi riprendi in italiano.

Dopo 4-6 risposte, proponi una mini-sfida: "Prova a spiegare in 3-4 frasi perché Savonarola insisteva sulla preparazione alla morte, usando almeno tre connettivi." Poi reagisci al contenuto.

Se l'utente chiede il riepilogo finale, non fare nuove domande: dai al massimo due correzioni fondate su frasi effettivamente pronunciate, preferendo i connettivi. Riporta brevemente la frase e una versione migliore. Se non ci sono errori chiari, dillo. Invita a ripetere una frase utile e saluta. Se un comando chiede di ripetere o parlare più lentamente, ripeti l'ultima domanda più lentamente. Rimani in questa attività di italiano.`;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'method'});}
 if(req.headers.origin!=='https://study.dariakuzno.it')return res.status(403).json({error:'origin'});
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.status(503).json({error:'not_configured'});
 try{
 const config={responseModalities:['AUDIO'],systemInstruction:{parts:[{text:instruction}]},inputAudioTranscription:{},outputAudioTranscription:{},realtimeInputConfig:{automaticActivityDetection:{disabled:true}}};
 const response=await fetch('https://generativelanguage.googleapis.com/v1alpha/auth_tokens',{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({
   uses:1,
   expireTime:new Date(Date.now()+300000).toISOString(),
   newSessionExpireTime:new Date(Date.now()+60000).toISOString(),
   bidiGenerateContentSetup:{
     model:'models/'+MODEL,
     generationConfig:{responseModalities:config.responseModalities},
     systemInstruction:config.systemInstruction,
     inputAudioTranscription:config.inputAudioTranscription,
     outputAudioTranscription:config.outputAudioTranscription,
     realtimeInputConfig:config.realtimeInputConfig
   }
 }),signal:AbortSignal.timeout(12000)});
 if(!response.ok){
   const status=response.status;
   let upstreamStatus='UNKNOWN', upstreamMessage='';
   try{
     const failure=await response.json();
     upstreamStatus=String(failure?.error?.status||'UNKNOWN').slice(0,64);
     upstreamMessage=String(failure?.error?.message||'').split('\\n')[0].slice(0,350).replaceAll(key,'[REDACTED]');
   }catch{}
   console.error('[gemini-polina] ephemeral-token upstream failure',{status,upstreamStatus,upstreamMessage});
   const error=status===429?'quota':status===400?'google_request':status===401||status===403?'google_auth':status===404?'google_endpoint':status>=500?'google_unavailable':'provider';
   return res.status(status===429?429:502).json({error});
 }
 const token=await response.json();
 if(!token.name)return res.status(502).json({error:'provider'});
 return res.status(200).json({token:token.name,model:MODEL,config,maxSeconds:300});
 }catch{return res.status(502).json({error:'provider'});}
};
