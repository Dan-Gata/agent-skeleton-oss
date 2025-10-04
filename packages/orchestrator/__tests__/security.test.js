const request = require('supertest');
const express = require('express');

// Test simple pour vérifier la sécurité de base
describe('🔒 Tests de Sécurité', () => {
    let app;
    
    beforeAll(() => {
        // Import de notre app (sans démarrer le serveur)
        app = require('../src/index.js');
    });
    
    describe('Headers de Sécurité', () => {
        test('Doit inclure les headers Helmet', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });
        
        test('Ne doit pas exposer X-Powered-By', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['x-powered-by']).toBeUndefined();
        });
    });
    
    describe('Rate Limiting', () => {
        test('Doit limiter les requêtes API', async () => {
            // Simuler beaucoup de requêtes rapidement
            const promises = Array(60).fill().map(() => 
                request(app).post('/api/chat/public').send({ message: 'test' })
            );
            
            const responses = await Promise.all(promises);
            const rateLimited = responses.some(res => res.status === 429);
            expect(rateLimited).toBe(true);
        });
    });
    
    describe('Validation des Entrées', () => {
        test('Doit rejeter les messages vides', async () => {
            const response = await request(app)
                .post('/api/chat/public')
                .send({ message: '' });
            expect(response.status).toBe(400);
        });
        
        test('Doit rejeter les messages trop longs', async () => {
            const longMessage = 'x'.repeat(6000);
            const response = await request(app)
                .post('/api/chat/public')
                .send({ message: longMessage });
            expect(response.status).toBe(400);
        });
        
        test('Doit rejeter les modèles non autorisés', async () => {
            const response = await request(app)
                .post('/api/chat/public')
                .send({ 
                    message: 'test',
                    model: 'malicious-model' 
                });
            expect(response.status).toBe(400);
        });
    });
    
    describe('Routes de Sécurité', () => {
        test('Health check doit être accessible', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.security).toBeDefined();
        });
        
        test('Routes inexistantes doivent retourner 404', async () => {
            const response = await request(app).get('/route-inexistante');
            expect(response.status).toBe(404);
        });
    });
});