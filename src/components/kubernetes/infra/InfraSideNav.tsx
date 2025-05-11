import React, { useContext, useEffect, useState } from 'react'
import { categories } from './categories';
import { InfraContext } from './context/InfraContext';
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';

function InfraSideNav() {
    const {
      selectedCategory,
      setSelectedCategory,
      selectedSubcategory,
      setSelectedSubcategory,
      setSelectedResource,
    } = useContext(InfraContext);

  return (
    <div className="w-80 pl-2 border-r h-full border-gray-200 bg-gray-50">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Infrastructure</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.name}>
                <button
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setSelectedSubcategory(null);
                    setSelectedResource(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    selectedCategory === category.name
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <category.icon className="h-5 w-5" />
                  <span>{category.name}</span>
                </button>
                {selectedCategory === category.name && (
                  <div className="ml-6 mt-2 space-y-1">
                    {category.subcategories.map((sub) => (
                      <button
                        key={sub.name}
                        onClick={() => setSelectedSubcategory(sub.name)}
                        className={`w-full text-left px-3 py-1 text-sm rounded-md ${
                          selectedSubcategory === sub.name
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
  )
}

export default InfraSideNav