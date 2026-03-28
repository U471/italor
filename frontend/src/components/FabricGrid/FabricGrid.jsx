import FabricCard from '../FabricCard/FabricCard';

const FabricGrid = ({ fabrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48 mb-3" />
            <div className="bg-gray-200 rounded h-4 mb-2" />
            <div className="bg-gray-200 rounded h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }
  if (!fabrics?.length) return <div className="text-center py-16"><p className="text-gray-500 text-lg">No fabrics found.</p></div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {fabrics.map((fabric) => <FabricCard key={fabric._id} fabric={fabric} />)}
    </div>
  );
};
export default FabricGrid;
