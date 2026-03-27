import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

/**
 * SCRUM-46 — Frontend smoke tests
 * AC1: App builds and renders without crashing (CI build step validates this)
 * These tests guard the root render path used by the CI build gate.
 */

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
};

describe('App', () => {
  it('renders the home page at the root route', () => {
    renderWithRouter(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('iTailor')).toBeInTheDocument();
  });

  it('renders the tagline on the home page', () => {
    renderWithRouter(<App />);
    expect(
      screen.getByText(/custom made-to-measure suits/i)
    ).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes', () => {
    renderWithRouter(<App />, { initialEntries: ['/does-not-exist'] });
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('renders a home link on the 404 page', () => {
    renderWithRouter(<App />, { initialEntries: ['/does-not-exist'] });
    const link = screen.getByRole('link', { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the register page at /register', () => {
    renderWithRouter(<App />, { initialEntries: ['/register'] });
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });
});
