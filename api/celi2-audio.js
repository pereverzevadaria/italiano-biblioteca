const { unzipSync } = require('fflate');

module.exports = async function handler(req, res) {
  try {
    const url = 'https://www.unistrapg.it/sites/default/files/docs/certificazioni/celi-2-prove-esame.zip';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const zip = new Uint8Array(await response.arrayBuffer());
    const files = unzipSync(zip);
    const audio = Object.entries(files)
      .filter(([name]) => /\.(mp3|wav|m4a|ogg)$/i.test(name))
      .sort(([a], [b]) => a.localeCompare(b));

    if (req.query && req.query.list === '1') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json(audio.map(([name, data], index) => ({ index, name, size: data.length })));
    }

    const index = Math.max(0, Math.min(Number(req.query && req.query.index || 0), audio.length - 1));
    if (!audio.length) return res.status(404).send('Audio not found in official CELI 2 archive');
    const [name, data] = audio[index];
    const ext = name.split('.').pop().toLowerCase();
    const types = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg' };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.setHeader('Content-Length', String(data.length));
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(Buffer.from(data));
  } catch (error) {
    console.error(error);
    return res.status(500).send('CELI audio unavailable');
  }
};
