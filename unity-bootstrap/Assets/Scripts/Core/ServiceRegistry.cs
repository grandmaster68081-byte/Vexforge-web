using System;
using System.Collections.Generic;

namespace Vexforge.Core
{
    public sealed class ServiceRegistry
    {
        private readonly Dictionary<Type, object> services = new Dictionary<Type, object>();

        public void Register<T>(T service) where T : class
        {
            services[typeof(T)] = service;
        }

        public T Resolve<T>() where T : class
        {
            object value;
            return services.TryGetValue(typeof(T), out value) ? value as T : null;
        }
    }
}