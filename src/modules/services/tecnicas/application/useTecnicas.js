// presentation/hooks/useTecnicas.js
import { useState, useEffect } from 'react';
import { tecnicasRepository } from '../infrastructure/tecnicas.repository';

export const useTecnicas = (filters = {}) => {
  const [tecnicas, setTecnicas] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Cargar o listar técnicas desde el servidor
  const fetchTecnicas = async () => {
    setLoading(true);
    try {
      // Le pasamos los filtros (como filtros.search) al repositorio
      const data = await tecnicasRepository.list(filters);
      setTecnicas(data); // El DTO ya se encargó de dejarlo como un array estructurado
    } catch (error) {
      console.error("Error en el hook al cargar las técnicas:", error);
      setTecnicas([]); // Evitamos que la UI falle al hacer un .map()
    } finally {
      setLoading(false);
    }
  };

  // 2. Crear una nueva técnica/servicio
  const handleCreate = async (tecnicaData) => {
    try {
      await tecnicasRepository.create(tecnicaData);
      await fetchTecnicas(); // Recarga limpia de la tabla tras crear con éxito
    } catch (error) {
      console.error("Error en el hook al crear la técnica:", error);
      throw error; // Lo lanzamos para que el modal del formulario pueda capturar el mensaje y mostrarlo en un alert/toast
    }
  };

  // 3. Editar una técnica/servicio existente
  const handleUpdate = async (id, updatedData) => {
    try {
      await tecnicasRepository.update(id, updatedData);
      await fetchTecnicas(); // Refresca los cambios en la UI de inmediato
    } catch (error) {
      console.error(`Error en el hook al actualizar la técnica #${id}:`, error);
      throw error;
    }
  };

  // 4. Desactivar lógicamente una técnica (Borrado lógico)
  const handleDelete = async (id) => {
    try {
      await tecnicasRepository.delete(id);
      await fetchTecnicas(); // Refresca el estado en la tabla (pasará de activo a inactivo o desaparecerá según tus filtros)
    } catch (error) {
      console.error(`Error en el hook al desactivar la técnica #${id}:`, error);
      throw error;
    }
  };

  // 5. Efecto para escuchar la barra de búsqueda en tiempo real
  useEffect(() => {
    fetchTecnicas();
  }, [filters.search]); // Si el usuario escribe en el input 'search', se dispara la petición al endpoint de búsqueda parcial

  return {
    tecnicas,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    refreshTecnicas: fetchTecnicas
  };
};