import './globals.css';

export const metadata = {
  title: 'J.A.R.V.I.S.',
  description: 'Just A Rather Very Intelligent System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body style={{ height: '100vh', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}