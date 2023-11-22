const express = require('express');
const { getBuses, getParada, getParadas } = require('../lib');
const routes = express.Router();

const apicache = require('apicache');
const cache = apicache.middleware;

routes.get('/', (req, res) => {
  return res.send(
    `Añade un número de parada y línea a la URL para continuar. Sintaxis: https://${req.hostname}/Nº parada/Línea.<br/><br/>Por ejemplo: https://${req.hostname}/811/3`,
  );
});

routes.get('/paradas', cache('1 day'), async (req, res) => {
  console.log('GET /paradas');
  const paradas = await getParadas();
  return res.status(200).send(paradas);
});

routes.get('/:numParada', cache('15 seconds'), async (req, res) => {
  const { numParada } = req.params;
  req.apicacheGroup = numParada;

  const { parada, html } = await getParada(numParada);
  if (!parada.nombre) {
    return res.status(404).json({
      message: `No se han encontrado la parada nº ${numParada}.`,
    });
  }

  const buses = await getBuses(html);

  if (!buses) {
    return res
      .status(404)
      .json({ error: 'No se han encontrado buses en la parada indicada' });
  }

  return res.json({
    parada,
    buses,
  });
});

routes.get('/:numParada/:linea', cache('15 seconds'), async (req, res) => {
  const { numParada, linea } = req.params;
  req.apicacheGroup = numParada;

  const { parada, html } = await getParada(numParada);
  const allBuses = await getBuses(html);
  if (!allBuses) {
    return res.status(404).json({
      message: `No se han encontrado buses en la parada nº ${numParada}.`,
    });
  }

  const buses = allBuses.filter((bus) => bus.linea === linea);
  if (!buses.length) {
    return res.status(404).json({
      message: `No se ha encontrado la línea ${linea} en la parada nº ${numParada}`,
    });
  }

  return res.json({
    parada,
    buses,
  });
});

module.exports = routes;
