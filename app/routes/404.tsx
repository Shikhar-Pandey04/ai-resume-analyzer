import { Link } from "react-router";

export const meta = () => ([
    { title: 'Page Not Found | Resumind' },
    { name: 'description', content: 'The page you are looking for does not exist' },
]);

const NotFound = () => {
    return (
        <main className="pt-16 p-4 container mx-auto text-center">
            <div className="max-w-md mx-auto">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
                <p className="text-gray-500 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Link 
                    to="/" 
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <img src="/icons/back.svg" alt="back" className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
            </div>
        </main>
    );
};

export default NotFound;
